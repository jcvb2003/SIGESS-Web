import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { documentService } from '../services/documentService'
import { documentQueryKeys } from '../queryKeys'
import type { DocumentListItem, DocumentSearchParams } from '../types/document.types'

export function useExistingRequests(params: DocumentSearchParams) {
  const query = useQuery({
    queryKey: documentQueryKeys.list(params),
    queryFn: () => documentService.listRequests(params),
    staleTime: 1000 * 60 * 2,
  })

  return {
    documents: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}

const DEFAULT_PAGE_SIZE = 10

const formatCpf = (value: string | null): string => {
  if (!value) {
    return '-'
  }

  const digits = value.replace(/\D/g, '')

  if (digits.length !== 11) {
    return value
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

const formatDate = (value: string | null): string => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('pt-BR')
}

const getStatusLabel = (status: string | null): string => {
  if (!status) {
    return 'Não informado'
  }

  return status
}

export function useDocumentsListController() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = DEFAULT_PAGE_SIZE

  const { documents, total, isLoading, isFetching, error, refetch } = useExistingRequests({
    page,
    pageSize,
    searchTerm,
  })

  const showingCount = useMemo(() => {
    if (!total) {
      return 0
    }

    const max = page * pageSize
    return Math.min(max, total)
  }, [page, pageSize, total])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setPage(1)
  }

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage((current) => current - 1)
    }
  }

  const handleNextPage = () => {
    if (showingCount < total) {
      setPage((current) => current + 1)
    }
  }

  const handleNewDocument = () => {
    console.log('Novo documento')
  }

  const handleViewPdf = (document: DocumentListItem) => {
    console.log('Visualizar PDF', document.id)
  }

  const handleReprint = (document: DocumentListItem) => {
    console.log('Reimprimir documento', document.id)
  }

  const handleDelete = (document: DocumentListItem) => {
    console.log('Excluir registro de documento', document.id)
  }

  return {
    search: {
      value: searchTerm,
      onChange: handleSearchChange,
    },
    list: {
      documents,
      total,
      isLoading,
      isFetching,
      error,
      refetch,
    },
    pagination: {
      page,
      showingCount,
      onPreviousPage: handlePreviousPage,
      onNextPage: handleNextPage,
    },
    actions: {
      onNewDocument: handleNewDocument,
      onViewPdf: handleViewPdf,
      onReprint: handleReprint,
      onDelete: handleDelete,
    },
    formatters: {
      formatCpf,
      formatDate,
      getStatusLabel,
    },
  }
}
