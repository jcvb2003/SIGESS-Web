import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type TenantRole = "owner" | "member";

interface AccessScope {
  isAdmin: boolean;
  tenantId: string | null;
  tenantRole: TenantRole | null;
  operatorType: string | null;
  unitIds: string[];
}

async function resolveTenantCodeForRedirect(
  admin: SupabaseClient,
  scope: AccessScope,
  payloadTenantCode?: string | null,
) {
  if (typeof payloadTenantCode === "string" && payloadTenantCode.trim() !== "") {
    return payloadTenantCode.trim();
  }

  if (!scope.tenantId) {
    return null;
  }

  const { data, error } = await admin
    .from("tenants")
    .select("code")
    .eq("id", scope.tenantId)
    .maybeSingle();

  if (error) throw error;

  const code = (data as { code?: string | null } | null)?.code ?? null;
  return code && code.trim() !== "" ? code.trim() : null;
}

async function getActiveTenantUnitIds(admin: SupabaseClient, tenantId: string) {
  const { data: units, error } = await admin
    .from("tenant_units")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (error) throw error;

  return (units ?? [])
    .map((row) => (row as { id?: string | null }).id)
    .filter((value): value is string => Boolean(value));
}

function hasTenantWidePresidentScope(scope: AccessScope, tenantUnitIds: string[]) {
  return (
    scope.tenantId !== null &&
    scope.tenantRole !== "owner" &&
    scope.operatorType === "presidente" &&
    tenantUnitIds.length === 1
  );
}

async function resolveSharedTargetUnitId(
  admin: SupabaseClient,
  scope: AccessScope,
  activeUnitId?: string | null,
) {
  if (!scope.tenantId) {
    return null;
  }

  const tenantUnitIds = await getActiveTenantUnitIds(admin, scope.tenantId);
  const targetUnitId =
    activeUnitId ??
    (scope.unitIds.length === 1 ? scope.unitIds[0] : null) ??
    (tenantUnitIds.length === 1 ? tenantUnitIds[0] : null);

  return {
    tenantUnitIds,
    targetUnitId,
    isTenantWidePresident: hasTenantWidePresidentScope(scope, tenantUnitIds),
  };
}

async function findAuthUserByEmail(admin: SupabaseClient, email: string) {
  let page = 1;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const found = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;

    if (data.users.length < 1000) break;
    page += 1;
  }

  return null;
}

async function resolveAccessScope(admin: SupabaseClient, currentUser: User, hintTenantId?: string | null): Promise<AccessScope> {
  const isAdmin = currentUser.app_metadata?.role === "admin";

  let tenantQuery = admin
    .from("tenant_users")
    .select("tenant_id, tenant_role, operator_type")
    .eq("user_id", currentUser.id)
    .eq("is_active", true)
    .limit(1);

  if (hintTenantId) {
    tenantQuery = tenantQuery.eq("tenant_id", hintTenantId);
  }

  const { data: tenantUser, error: tenantUserError } = await tenantQuery.maybeSingle();

  if (tenantUserError) throw tenantUserError;

  const tenantId = (tenantUser as { tenant_id?: string | null } | null)?.tenant_id ?? null;
  const tenantRole = ((tenantUser as { tenant_role?: TenantRole | null } | null)?.tenant_role ?? null) as TenantRole | null;
  const operatorType = (tenantUser as { operator_type?: string | null } | null)?.operator_type ?? null;

  if (!tenantId || !tenantRole) {
    return { isAdmin, tenantId: null, tenantRole: null, operatorType: null, unitIds: [] };
  }

  if (tenantRole === "owner") {
    return { isAdmin, tenantId, tenantRole, operatorType: null, unitIds: [] };
  }

  const { data: memberships, error: membershipsError } = await admin
    .from("user_unit_memberships")
    .select("unit_id")
    .eq("tenant_id", tenantId)
    .eq("user_id", currentUser.id)
    .eq("is_active", true);

  if (membershipsError) throw membershipsError;

  return {
    isAdmin,
    tenantId,
    tenantRole,
    operatorType,
    unitIds: (memberships ?? [])
      .map((row) => (row as { unit_id?: string | null }).unit_id)
      .filter((value): value is string => Boolean(value)),
  };
}

function canManageOtherUsers(scope: AccessScope) {
  if (scope.isAdmin) return true;
  if (scope.tenantId !== null) {
    return scope.tenantRole === "owner" || scope.operatorType === "presidente";
  }
  return false;
}

function canViewAllUsers(scope: AccessScope) {
  if (scope.tenantId !== null) {
    return scope.tenantRole === "owner" || scope.operatorType === "presidente";
  }
  return scope.isAdmin;
}

async function listSharedAllowedIds(
  admin: SupabaseClient,
  scope: AccessScope,
  currentUser: User,
  activeUnitId?: string | null,
) {
  if (!scope.tenantId) {
    return [currentUser.id];
  }
  if (scope.tenantRole === "owner") {
    if (activeUnitId) {
      const { data: memberships, error } = await admin
        .from("user_unit_memberships")
        .select("user_id")
        .eq("tenant_id", scope.tenantId)
        .eq("is_active", true)
        .eq("unit_id", activeUnitId);
      if (error) throw error;
      return Array.from(
        new Set(
          (memberships ?? [])
            .map((row) => (row as { user_id?: string | null }).user_id)
            .filter((value): value is string => Boolean(value))
            .concat(currentUser.id),
        ),
      );
    }
    const { data: tenantUsers, error } = await admin
      .from("tenant_users")
      .select("user_id")
      .eq("tenant_id", scope.tenantId)
      .eq("is_active", true);
    if (error) throw error;
    return Array.from(
      new Set(
        (tenantUsers ?? [])
          .map((row) => (row as { user_id?: string | null }).user_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );
  }
  const sharedTarget = await resolveSharedTargetUnitId(admin, scope, activeUnitId);
  if (!sharedTarget) {
    return [currentUser.id];
  }
  if (sharedTarget.isTenantWidePresident) {
    const { data: tenantUsers, error } = await admin
      .from("tenant_users")
      .select("user_id")
      .eq("tenant_id", scope.tenantId)
      .eq("is_active", true);
    if (error) throw error;
    return Array.from(
      new Set(
        (tenantUsers ?? [])
          .map((row) => (row as { user_id?: string | null }).user_id)
          .filter((value): value is string => Boolean(value))
          .concat(currentUser.id),
      ),
    );
  }
  if (scope.unitIds.length === 0) {
    return [currentUser.id];
  }
  const filteredUnitIds =
    sharedTarget.targetUnitId && scope.unitIds.includes(sharedTarget.targetUnitId)
      ? [sharedTarget.targetUnitId]
      : scope.unitIds;
  const { data: memberships, error } = await admin
    .from("user_unit_memberships")
    .select("user_id")
    .eq("tenant_id", scope.tenantId)
    .eq("is_active", true)
    .in("unit_id", filteredUnitIds);
  if (error) throw error;
  return Array.from(
    new Set(
      (memberships ?? [])
        .map((row) => (row as { user_id?: string | null }).user_id)
        .filter((value): value is string => Boolean(value))
        .concat(currentUser.id),
    ),
  );
}

async function attachUserToSharedScope(
  admin: SupabaseClient,
  scope: AccessScope,
  currentUser: User,
  createdUserId: string,
  role: string,
  activeUnitId?: string | null,
) {
  if (!scope.tenantId) {
    return;
  }
  const sharedTarget = await resolveSharedTargetUnitId(admin, scope, activeUnitId);
  if (!sharedTarget?.targetUnitId) {
    throw new Error("Polo ativo obrigatorio para cadastrar usuarios neste contexto.");
  }
  if (
    scope.tenantRole !== "owner" &&
    !sharedTarget.isTenantWidePresident &&
    scope.unitIds.length > 0 &&
    !scope.unitIds.includes(sharedTarget.targetUnitId)
  ) {
    throw new Error("Polo fora do escopo do usuario atual.");
  }
  const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(createdUserId);
  if (authUserError) throw authUserError;
  const { error: profileError } = await admin
    .from("user_profiles")
    .upsert(
      {
        id: createdUserId,
        email: authUser?.user?.email ?? null,
        nome: (authUser?.user?.user_metadata as { nome?: string } | undefined)?.nome ?? null,
        is_active: true,
      },
      { onConflict: "id" },
    );
  if (profileError) throw profileError;
  const operatorType = role === "admin" ? "presidente" : "auxiliar";
  const { error: tenantUserError } = await admin
    .from("tenant_users")
    .upsert(
      {
        tenant_id: scope.tenantId,
        user_id: createdUserId,
        tenant_role: "member",
        operator_type: operatorType,
        is_active: true,
      },
      { onConflict: "tenant_id,user_id" },
    );
  if (tenantUserError) throw tenantUserError;
  const membershipPayload = {
    tenant_id: scope.tenantId,
    user_id: createdUserId,
    unit_id: sharedTarget.targetUnitId,
    is_active: true,
    updated_at: new Date().toISOString(),
  };
  const { data: existingMembership, error: existingMembershipError } = await admin
    .from("user_unit_memberships")
    .select("id")
    .eq("user_id", createdUserId)
    .eq("unit_id", sharedTarget.targetUnitId)
    .maybeSingle();
  if (existingMembershipError) throw existingMembershipError;
  if (existingMembership) {
    const { error: updateMembershipError } = await admin
      .from("user_unit_memberships")
      .update(membershipPayload)
      .eq("id", (existingMembership as { id: string }).id);
    if (updateMembershipError) throw updateMembershipError;
    return;
  }
  const { error: insertMembershipError } = await admin
    .from("user_unit_memberships")
    .insert({
      ...membershipPayload,
      created_at: new Date().toISOString(),
    });
  if (insertMembershipError) throw insertMembershipError;
}

function mapMergedUser(
  currentUser: User,
  authUser: Partial<User> | null,
  publicUser: Record<string, unknown> | null,
) {
  const bannedUntilRaw = (authUser as { banned_until?: string | null } | null)?.banned_until;
  const bannedUntil = (bannedUntilRaw && bannedUntilRaw !== "") ? new Date(bannedUntilRaw) : null;
  const ativo = !(bannedUntil && bannedUntil > new Date());

  return {
    id: String(publicUser?.id ?? authUser?.id ?? currentUser.id),
    email:
      (publicUser?.email ? String(publicUser.email) : null) ??
      authUser?.email ??
      currentUser.email ??
      null,
    nome:
      (publicUser?.nome ? String(publicUser.nome) : null) ??
      ((authUser?.user_metadata as { nome?: string } | undefined)?.nome ?? null),
    role:
      ((authUser?.app_metadata as { role?: string } | undefined)?.role ?? null) ??
      "user",
    ativo,
    createdAt:
      (publicUser?.created_at ? String(publicUser.created_at) : null) ??
      authUser?.created_at ??
      currentUser.created_at,
    emailConfirmedAt: authUser?.email_confirmed_at ?? currentUser.email_confirmed_at,
  };
}

// ---------- Handlers de action ----------

async function handleInvite(admin: SupabaseClient, payload: Record<string, string>) {
  const { email, nome, role = "user", tenantCode } = payload;

  const appOrigin = Deno.env.get("APP_ORIGIN") || "https://app.sigess.com.br";
  const redirectTo = tenantCode
    ? `${appOrigin}/password?tenant=${tenantCode}`
    : `${appOrigin}/password`;

  console.log(`[ManageUser] Convidando usuário: ${email} (${role})`);

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: { nome, role },
  });

  if (error) {
    console.error("[ManageUser] Erro no inviteUserByEmail:", error.message, error);
    throw error;
  }

  if (data.user) {
    await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { role } });
  }

  return data;
}

async function handleInviteWithResolvedTenantCode(
  admin: SupabaseClient,
  scope: AccessScope,
  payload: Record<string, string>,
) {
  const tenantCode = await resolveTenantCodeForRedirect(
    admin,
    scope,
    typeof payload.tenantCode === "string" ? payload.tenantCode : null,
  );

  return handleInvite(admin, {
    ...payload,
    ...(tenantCode ? { tenantCode } : {}),
  });
}

async function handleInviteWithScope(
  admin: SupabaseClient,
  scope: AccessScope,
  currentUser: User,
  payload: Record<string, string>,
) {
  const data = await handleInviteWithResolvedTenantCode(admin, scope, payload);
  const createdUserId =
    (data as { user?: { id?: string } } | null)?.user?.id ??
    (data as { id?: string } | null)?.id ??
    null;

  if (createdUserId) {
    const targetUnitId =
      typeof payload.activeUnitId === "string"
        ? payload.activeUnitId
        : typeof payload.unitId === "string"
          ? payload.unitId
          : null;
    await attachUserToSharedScope(
      admin,
      scope,
      currentUser,
      createdUserId,
      String(payload.role ?? "user"),
      targetUnitId,
    );
  }

  return data;
}

async function handleCreate(admin: SupabaseClient, payload: Record<string, string | boolean>) {
  const { email, password, nome, role = "user", email_confirm = true } = payload;

  console.log(`[ManageUser] Criando usuário manual: ${email} (${role})`);

  const { data, error } = await admin.auth.admin.createUser({
    email: email as string,
    password: password as string,
    user_metadata: { nome, role },
    app_metadata: { role },
    email_confirm: email_confirm as boolean,
  });
  if (error) throw error;

  return data;
}

async function handleCreateWithScope(
  admin: SupabaseClient,
  scope: AccessScope,
  currentUser: User,
  payload: Record<string, string | boolean>,
) {
  const role = String(payload.role ?? "user");
  const activeUnitId =
    typeof payload.activeUnitId === "string"
      ? payload.activeUnitId
      : typeof payload.unitId === "string"
        ? payload.unitId
        : null;
  try {
    const data = await handleCreate(admin, payload);
    const createdUserId =
      (data as { user?: { id?: string } } | null)?.user?.id ??
      (data as { id?: string } | null)?.id ??
      null;
    if (createdUserId) {
      await attachUserToSharedScope(
        admin,
        scope,
        currentUser,
        createdUserId,
        role,
        activeUnitId,
      );
    }
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const email = typeof payload.email === "string" ? payload.email : null;
    const isExistingEmailError =
      email !== null &&
      (message.includes("already been registered") || message.includes("already registered"));
    if (!isExistingEmailError) {
      throw error;
    }
    const existingUser = await findAuthUserByEmail(admin, email);
    if (!existingUser) {
      throw error;
    }
    const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
      password: typeof payload.password === "string" ? payload.password : undefined,
      email_confirm: payload.email_confirm as boolean | undefined,
      user_metadata: {
        nome: typeof payload.nome === "string" ? payload.nome : null,
        role,
      },
      app_metadata: { role },
      ban_duration: "none",
    });
    if (updateError) throw updateError;
    await attachUserToSharedScope(
      admin,
      scope,
      currentUser,
      existingUser.id,
      role,
      activeUnitId,
    );
    return {
      user: existingUser,
      recoveredExistingUser: true,
    };
  }
}

async function handleDeactivate(admin: SupabaseClient, payload: Record<string, string>) {
  const { userId } = payload;
  console.log(`[ManageUser] Desativando usuário: ${userId}`);

  const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "876600h" });
  if (authError) throw authError;

  return { success: true, message: "Usuário desativado e banido no Auth" };
}

async function handleActivate(admin: SupabaseClient, payload: Record<string, string>) {
  const { userId } = payload;
  console.log(`[ManageUser] Reativando usuário: ${userId}`);

  const { error: authError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  if (authError) throw authError;

  return { success: true, message: "Usuário ativado" };
}

async function handleDelete(admin: SupabaseClient, payload: Record<string, string>) {
  const { userId } = payload;
  if (!userId) throw new Error("userId é obrigatório para exclusão");

  console.log(`[ManageUser] Excluindo usuário: ${userId}`);

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) throw authError;

  return { success: true, message: "Usuário excluído permanentemente" };
}

async function handleResendConfirmation(admin: SupabaseClient, payload: Record<string, string>) {
  const { email, tenantCode } = payload;
  if (!email) throw new Error("email é obrigatório para reenvio de confirmação");

  console.log(`[ManageUser] Reenviando confirmação para: ${email}`);

  const appOrigin = Deno.env.get("APP_ORIGIN") || "https://app.sigess.com.br";
  const redirectTo = tenantCode
    ? `${appOrigin}/password?tenant=${tenantCode}`
    : `${appOrigin}/password`;

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });
  if (error) throw error;

  return { success: true, message: "E-mail de confirmação reenviado com sucesso" };
}

async function handleResendConfirmationWithScope(
  admin: SupabaseClient,
  scope: AccessScope,
  payload: Record<string, string>,
) {
  const tenantCode = await resolveTenantCodeForRedirect(
    admin,
    scope,
    typeof payload.tenantCode === "string" ? payload.tenantCode : null,
  );

  return handleResendConfirmation(admin, {
    ...payload,
    ...(tenantCode ? { tenantCode } : {}),
  });
}

async function handleList(
  admin: SupabaseClient,
  currentUser: User,
  payload?: Record<string, unknown>,
) {
  const hintTenantId = typeof payload?.tenantId === "string" && (payload.tenantId as string).trim() !== ""
    ? (payload.tenantId as string).trim()
    : null;
  const scope = await resolveAccessScope(admin, currentUser, hintTenantId);
  const activeUnitId =
    typeof payload?.activeUnitId === "string" && payload.activeUnitId.trim() !== ""
      ? payload.activeUnitId.trim()
      : null;
  console.log(
    `[ManageUser] Listando usuários (tenantId=${scope.tenantId ?? "n/a"}, tenantRole=${scope.tenantRole ?? "n/a"}, operatorType=${scope.operatorType ?? "n/a"}, isAdmin=${scope.isAdmin})...`,
  );

  if (
    scope.tenantId !== null &&
    scope.tenantRole !== "owner" &&
    scope.unitIds.length > 0 &&
    activeUnitId === null
  ) {
    throw new Error("Polo ativo obrigatorio para listar a equipe neste contexto.");
  }

  const allowedIds =
    scope.tenantId !== null
      ? await listSharedAllowedIds(
          admin,
          scope,
          currentUser,
          activeUnitId,
        )
      : scope.isAdmin
        ? null
        : [currentUser.id];

  let dbQuery = admin.from("user_profiles").select("id, email, nome, is_active, created_at");
  if (allowedIds && allowedIds.length > 0) {
    dbQuery = dbQuery.in("id", allowedIds);
  }

  const { data: publicUsers, error: dbErr } = await dbQuery;
  if (dbErr) throw dbErr;

  // Busca tenantRole/operatorType para os usuários listados
  const tenantUserMap = new Map<string, { tenant_role: string | null; operator_type: string | null }>();
  if (scope.tenantId && allowedIds && allowedIds.length > 0) {
    const { data: tuData } = await admin
      .from("tenant_users")
      .select("user_id, tenant_role, operator_type")
      .eq("tenant_id", scope.tenantId)
      .in("user_id", allowedIds);
    for (const row of tuData ?? []) {
      const r = row as { user_id: string; tenant_role: string | null; operator_type: string | null };
      tenantUserMap.set(r.user_id, { tenant_role: r.tenant_role, operator_type: r.operator_type });
    }
  }

  if (!canViewAllUsers(scope)) {
    const selfPublicUser =
      (publicUsers?.find((user) => String((user as { id?: string }).id ?? "") === currentUser.id) as Record<string, unknown> | undefined) ??
      null;
    const selfTu = tenantUserMap.get(currentUser.id);

    return [{
      ...mapMergedUser(currentUser, currentUser, selfPublicUser),
      tenantRole: selfTu?.tenant_role ?? null,
      operatorType: selfTu?.operator_type ?? null,
    }];
  }

  const { data: { users }, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authError) throw authError;

  const visibleIds =
    allowedIds && allowedIds.length > 0
      ? new Set(allowedIds)
      : new Set((publicUsers ?? []).map((user) => String((user as { id?: string }).id ?? "")));

  return users
    .filter((authUser) => visibleIds.has(authUser.id))
    .map((authUser) => {
      const publicUser =
        (publicUsers?.find((user) => String((user as { id?: string }).id ?? "") === authUser.id) as Record<string, unknown> | undefined) ??
        null;
      const tu = tenantUserMap.get(authUser.id);
      return {
        ...mapMergedUser(currentUser, authUser, publicUser),
        tenantRole: tu?.tenant_role ?? null,
        operatorType: tu?.operator_type ?? null,
      };
    });
}

// ---------- Dispatcher ----------

const ACTION_HANDLERS: Record<
  string,
  (admin: SupabaseClient, payload: Record<string, string | boolean>) => Promise<unknown>
> = {
  invite: handleInvite,
  create: handleCreate,
  deactivate: handleDeactivate,
  activate: handleActivate,
  delete: handleDelete,
  resend_confirmation: handleResendConfirmation,
  list: handleList as unknown as (admin: SupabaseClient, payload: Record<string, string | boolean>) => Promise<unknown>,
  toggleUserStatus: (admin, payload) => {
    const isActive = payload.ativo !== undefined ? payload.ativo : payload.isActive;
    return isActive ? handleDeactivate(admin, payload as Record<string, string>) : handleActivate(admin, payload as Record<string, string>);
  },
};

// ---------- Entry point ----------

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sem cabeçalho de autorização");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);

    if (authErr || !user) {
      console.error("[ManageUser] Erro de autenticação do chamador:", authErr);
      throw new Error("Acesso não autorizado ou token expirado.");
    }

    const { action, payload = {} } = await req.json();
    const hintTenantId = typeof payload?.tenantId === "string" && payload.tenantId.trim() !== ""
      ? payload.tenantId.trim()
      : null;
    const accessScope = await resolveAccessScope(supabaseAdmin, user, hintTenantId);

    if (action !== "list" && !canManageOtherUsers(accessScope)) {
      console.warn(`[ManageUser] Tentativa de ação proibida (${action}) por usuário sem escopo administrativo: ${user.email}`);
      return jsonResponse({ error: "Operação restrita ao gestor da entidade." }, 403);
    }

    if (
      accessScope.tenantId !== null &&
      accessScope.tenantRole !== "owner" &&
      accessScope.unitIds.length > 0 &&
      ["deactivate", "activate", "delete", "toggleUserStatus"].includes(String(action))
    ) {
      const targetUserId =
        typeof payload?.userId === "string" ? payload.userId : null;

      if (!targetUserId) {
        return jsonResponse({ error: "Usuário alvo não informado." }, 400);
      }

      const allowedIds = await listSharedAllowedIds(supabaseAdmin, accessScope, user);
      if (!allowedIds.includes(targetUserId)) {
        console.warn(`[ManageUser] Ação ${action} fora do escopo do polo por ${user.email} em ${targetUserId}`);
        return jsonResponse({ error: "Operação fora do escopo do polo." }, 403);
      }
    }

    const handler = ACTION_HANDLERS[action];
    if (!handler) throw new Error(`Ação '${action}' desconhecida.`);

    const result =
      action === "list"
        ? await handleList(supabaseAdmin, user, payload)
        : action === "invite"
          ? await handleInviteWithScope(supabaseAdmin, accessScope, user, payload as Record<string, string>)
          : action === "resend_confirmation"
            ? await handleResendConfirmationWithScope(
                supabaseAdmin,
                accessScope,
                payload as Record<string, string>,
              )
          : action === "create"
            ? await handleCreateWithScope(
                supabaseAdmin,
                accessScope,
                user,
                payload as Record<string, string | boolean>,
              )
            : await handler(supabaseAdmin, payload);

    return jsonResponse(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    const detail = error instanceof Error ? null : (typeof error === "object" && error !== null ? JSON.stringify(error) : String(error));
    const status = message.includes("authorized") ? 401 : 400;

    console.error("[ManageUser] Erro fatal:", message, detail ?? error);
    return jsonResponse({ error: message, detail }, status);
  }
});
