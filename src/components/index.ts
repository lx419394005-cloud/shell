// components/index.ts
// Root barrel file for all components

// common
import { Button, type ButtonProps } from './common/Button/Button';
import { Card, type CardProps } from './common/Card/Card';
import { Modal, type ModalProps } from './common/Modal/Modal';
import { Toast, type ToastType } from './common/Toast/Toast';
import { RatioIcon, type RatioIconProps } from './common/RatioIcon/RatioIcon';
import { SettingsModal, type SettingsModalProps } from './common/SettingsModal/SettingsModal';

// layout
import { Navigation, type NavigationProps } from './layout/Navigation/Navigation';
import { Container, type ContainerProps } from './layout/Container/Container';

// home
import { MasonryGrid, type MasonryGridProps } from './home/MasonryGrid/MasonryGrid';
import { ImageCard, type ImageCardProps } from './home/ImageCard/ImageCard';
import { QuickAction, type QuickActionProps } from './home/QuickAction/QuickAction';
import { Welcome, type WelcomeProps } from './home/Welcome/Welcome';
import { GalleryHeader, type SortOrder } from './home/GalleryHeader/GalleryHeader';
import { ExportModal } from './home/ExportModal';

// create
import { CreateView, type CreateViewProps } from './create/CreateView/CreateView';
import { DrawPanel, type DrawPanelProps } from './create/DrawPanel/DrawPanel';
import { ChatPanel, type ChatPanelProps } from './create/ChatPanel/ChatPanel';
import { PromptInput, type PromptInputProps } from './create/PromptInput/PromptInput';

// common exports
export { Button, type ButtonProps };
export { Card, type CardProps };
export { Modal, type ModalProps };
export { Toast, type ToastType };
export { RatioIcon, type RatioIconProps };
export { SettingsModal, type SettingsModalProps };

// layout exports
export { Navigation, type NavigationProps };
export { Container, type ContainerProps };

// home exports
export { MasonryGrid, type MasonryGridProps };
export { ImageCard, type ImageCardProps };
export { QuickAction, type QuickActionProps };
export { Welcome, type WelcomeProps };
export { GalleryHeader, type SortOrder };
export { ExportModal };

// create exports
export { CreateView, type CreateViewProps };
export { DrawPanel, type DrawPanelProps };
export { ChatPanel, type ChatPanelProps };
export { PromptInput, type PromptInputProps };
