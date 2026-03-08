
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Card, CardContent } from "@/shared/components/ui/card"

export function DefesoRequestDocument() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Requerimento de Seguro Defeso</h2>
      </div>

      <Tabs defaultValue="requerente" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="requerente">Requerente</TabsTrigger>
          <TabsTrigger value="pdf">Gerar PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="requerente">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Dados do requerente (em breve)</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pdf">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Preview e geração de PDF (em breve)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
