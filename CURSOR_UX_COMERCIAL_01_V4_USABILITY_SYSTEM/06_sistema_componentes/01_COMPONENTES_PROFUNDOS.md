# 01_COMPONENTES_PROFUNDOS

## Componentes recomendados

Crear solo si no existen.

```txt
OperationalPageHeader
ProcessStateBanner
NextActionPanel
ProcessTimeline
MetricCard
NoticeStack
GuidedEmptyState
TechnicalDetailsPanel
FutureFeatureCard
```

## OperationalPageHeader

Uso:

```txt
titulo
subtitulo
breadcrumb
periodo
estado
acciones
```

## ProcessStateBanner

Para mostrar estado principal:

```txt
Nomina cerrada operativamente
Liquidaciones generadas
Pendiente de validar
```

## NextActionPanel

Debe aceptar:

```txt
title
description
primaryAction
disabledReason
secondaryLinks
```

## ProcessTimeline

Debe mostrar pasos y estado.

## GuidedEmptyState

Debe aceptar:

```txt
title
description
primaryAction
secondaryAction
learnMore opcional
```

## FutureFeatureCard

Para Previred/LRE/Banco/PDF:

```txt
label
descripcion
estado: Disponible en fase posterior
```

No permitir accion primaria activa.
