// ChefCloud Icon Library — Lucide-style line icons, 24×24 grid.
// Все иконки монохромные, stroke-based, без emoji и цвета.

const B = { viewBox:'0 0 24 24', fill:'none', stroke:'currentColor' }

const ic = (paths, w=16, sw=1.8) => (props) => (
  <svg width={w} height={w} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...B} {...props}>
    {paths}
  </svg>
)

// ── Навигация ──────────────────────────────────────────────────────────────
export const HomeIcon = ic(<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>)
export const MenuIcon = ic(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></>)
export const WarehouseIcon = ic(<><path d="M22 8.35V20a2 2 0 01-2 2H4a2 2 0 01-2-2V8.35A2 2 0 013.26 6.5l8-3.2a2 2 0 011.48 0l8 3.2A2 2 0 0122 8.35z"/><path d="M6 18h12M6 14h12M6 10h12"/></>)
export const PackageIcon = ic(<><line x1="16.5" y1="9.4" x2="7.55" y2="4.24"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>)
export const FlameIcon = ic(<><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></>)
export const PrinterIcon = ic(<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>)
export const CheckCircleIcon = ic(<><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>)
export const BotIcon = ic(<><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 14v2M16 14v2"/><line x1="8" y1="11" x2="8" y2="11"/><line x1="16" y1="11" x2="16" y2="11"/></>)
export const BarChartIcon = ic(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>)
export const SettingsIcon = ic(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>)
export const LayersIcon = ic(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>)
export const BookOpenIcon = ic(<><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></>)

// ── UI ─────────────────────────────────────────────────────────────────────
export const SearchIcon = ic(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, 15)
export const CloseIcon  = ic(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, 14, 2.2)
export const CheckIcon  = ic(<><polyline points="20 6 9 17 4 12"/></>, 13, 2.5)
export const FilterIcon = ic(<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>, 15)
export const PlusIcon   = ic(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, 15, 2)
export const ChevronDownIcon = ic(<><polyline points="6 9 12 15 18 9"/></>, 14, 2)
export const ChevronRightIcon = ic(<><polyline points="9 18 15 12 9 6"/></>, 14, 2)
export const ArrowLeftIcon = ic(<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>, 15, 2)
export const EditIcon   = ic(<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>, 15)
export const TrashIcon  = ic(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>, 15)
export const CopyIcon   = ic(<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>, 15)
export const DownloadIcon = ic(<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>, 15)
export const UploadIcon = ic(<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>, 15)
export const StarIcon   = ic(<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>, 14)
export const AlertIcon  = ic(<><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, 14)
export const InfoIcon   = ic(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>, 14)
export const ImageIcon  = ic(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>, 15)
export const SparkleIcon = ic(<><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z"/><path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5z"/></>, 16)
export const EyeIcon    = ic(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>, 15)
export const RefreshIcon = ic(<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>, 14)
export const ListIcon   = ic(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>, 15)
export const GridViewIcon = ic(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>, 15)
export const WandIcon   = ic(<><path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 6.2L11 5M12.2 11.8L11 13"/><path d="M3 21l9-9"/></>, 15)

// Совместимость со старыми именами
export const BookIcon        = BookOpenIcon
export const BowlIcon        = LayersIcon
export const FireIcon        = FlameIcon
export const CameraIcon      = ic(<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>)
export const ClipIcon        = ic(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>)
export const GraduationIcon  = ic(<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>)
export const GridIcon        = GridViewIcon
export const WarnIcon        = AlertIcon

export const Ico = {
  home: <HomeIcon />, menu: <MenuIcon />, warehouse: <WarehouseIcon />,
  package: <PackageIcon />, flame: <FlameIcon />, printer: <PrinterIcon />,
  check: <CheckCircleIcon />, bot: <BotIcon />, chart: <BarChartIcon />,
  settings: <SettingsIcon />, layers: <LayersIcon />, book: <BookOpenIcon />,
  search: <SearchIcon />, close: <CloseIcon />, filter: <FilterIcon />,
  plus: <PlusIcon />, edit: <EditIcon />, trash: <TrashIcon />,
  download: <DownloadIcon />, upload: <UploadIcon />, star: <StarIcon />,
  alert: <AlertIcon />, info: <InfoIcon />, image: <ImageIcon />,
  sparkle: <SparkleIcon />, eye: <EyeIcon />, wand: <WandIcon />,
  list: <ListIcon />, grid: <GridViewIcon />, arrow: <ArrowLeftIcon />,
}
