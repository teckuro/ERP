# 01_API_COMPONENTES

Crear solo si reduce duplicacion.

## CompactTabBar

```ts
interface CompactTab {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

@Input() tabs: CompactTab[];
@Input() activeId: string;
@Output() activeIdChange = new EventEmitter<string>();
```

Debe implementar:

```txt
role tablist/tab/tabpanel si controla paneles
keyboard arrows
scroll horizontal mobile
```

## CompactAccordion

```ts
interface AccordionItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
}
```

Debe implementar:

```txt
button header
aria-expanded
aria-controls
Enter/Space
```

## CompactQuickLinkList

Para dashboard/reportes:

```ts
interface QuickLink {
  label: string;
  description?: string;
  route?: string;
  disabled?: boolean;
  disabledReason?: string;
  status?: string;
}
```

## StatusStrip

```ts
interface StatusStripVm {
  label: string;
  description?: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  primaryAction?: ActionVm;
}
```

## GuidedEmptyStateCompact

```ts
interface EmptyStateVm {
  title: string;
  description: string;
  primaryAction?: ActionVm;
  secondaryAction?: ActionVm;
}
```

## FutureList

```ts
interface FutureItem {
  label: string;
  reason: string;
  phaseLabel?: string; // Fase posterior
}
```
