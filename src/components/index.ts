// components/index.ts
// Root barrel file for all components

// common
import { Button, type ButtonProps } from './common/Button/Button';
import { Card, type CardProps } from './common/Card/Card';
import { Modal, type ModalProps } from './common/Modal/Modal';

// layout
import { Navigation, type NavigationProps } from './layout/Navigation/Navigation';
import { Container, type ContainerProps } from './layout/Container/Container';

// home
import { MasonryGrid, type MasonryGridProps } from './home/MasonryGrid/MasonryGrid';
import { ImageCard, type ImageCardProps } from './home/ImageCard/ImageCard';
import { QuickAction, type QuickActionProps } from './home/QuickAction/QuickAction';
import { Welcome, type WelcomeProps } from './home/Welcome/Welcome';

// create
import { CreateView, type CreateViewProps } from './create/CreateView/CreateView';
import { DrawPanel, type DrawPanelProps } from './create/DrawPanel/DrawPanel';
import { ChatPanel, type ChatPanelProps } from './create/ChatPanel/ChatPanel';
import { PromptInput, type PromptInputProps } from './create/PromptInput/PromptInput';

// common exports
export { Button, type ButtonProps };
export { Card, type CardProps };
export { Modal, type ModalProps };

// layout exports
export { Navigation, type NavigationProps };
export { Container, type ContainerProps };

// home exports
export { MasonryGrid, type MasonryGridProps };
export { ImageCard, type ImageCardProps };
export { QuickAction, type QuickActionProps };
export { Welcome, type WelcomeProps };

// create exports
export { CreateView, type CreateViewProps };
export { DrawPanel, type DrawPanelProps };
export { ChatPanel, type ChatPanelProps };
export { PromptInput, type PromptInputProps };
