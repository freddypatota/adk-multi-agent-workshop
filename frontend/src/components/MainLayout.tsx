import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor, Menu, Sparkles, Activity, SquarePen } from "lucide-react";
import { cn } from "@/utils";
import {
    PanelResizeHandle,
    Panel,
    PanelGroup,
    ImperativePanelHandle
} from "react-resizable-panels";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

interface MainLayoutProps {
    children: React.ReactNode;
    sidebar: React.ReactNode;
    theme: "light" | "dark" | "system";
    onToggleTheme: () => void;
    title?: React.ReactNode;
    showTimeline?: boolean;
    onToggleTimeline?: () => void;
    onNewSession?: () => void;
}

export function MainLayout({ children, sidebar, theme, onToggleTheme, title, showTimeline, onToggleTimeline, onNewSession }: MainLayoutProps) {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const sidebarRef = useRef<ImperativePanelHandle>(null);
    const { t } = useTranslation();
    const { user, logout } = useAuth();

    const toggleSidebar = () => {
        const panel = sidebarRef.current;
        if (panel) {
            if (isSidebarOpen) {
                panel.collapse();
            } else {
                panel.expand();
            }
            setIsSidebarOpen(!isSidebarOpen);
        }
    };

    return (
        <div className="h-screen w-full overflow-hidden bg-background flex flex-col">
            {/* Header */}
            <header className="shrink-0 h-14 border-b flex items-center justify-between px-4 bg-background z-50">
                <div className="font-semibold text-lg flex items-center gap-2">
                    {title}
                </div>

                <div className="flex items-center justify-end gap-2">
                    {/* Desktop Controls */}
                    <div className="hidden md:flex items-center gap-2">
                        <div className="h-6 w-px bg-border mx-2" />

                        <div className="flex items-center gap-2 mr-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center" title={user?.email || 'User'}>
                                <span className="text-xs font-bold text-primary">
                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            title="Sign out"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>

                        {onNewSession && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onNewSession}
                                title={t('common.newSession', 'New session')}
                            >
                                <SquarePen className="h-5 w-5" />
                            </Button>
                        )}

                        {onToggleTimeline && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onToggleTimeline}
                                title={t('common.toggleTimeline', 'Toggle activity timeline')}
                                className={cn(showTimeline && "bg-accent")}
                            >
                                <Activity className={cn("h-5 w-5", showTimeline && "text-primary")} />
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleTheme}
                            title={t('common.toggleTheme')}
                        >
                            {theme === "light" && <Sun className="h-5 w-5" />}
                            {theme === "dark" && <Moon className="h-5 w-5" />}
                            {theme === "system" && <Monitor className="h-5 w-5" />}
                        </Button>
                    </div>

                    {/* Chat / Sidebar Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        title={isSidebarOpen ? t('common.closeSidebar') : t('common.openSidebar')}
                        className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-950/20"
                    >
                        <Sparkles className={cn("h-5 w-5 transition-all", isSidebarOpen && "fill-current opacity-100", !isSidebarOpen && "opacity-70")} />
                    </Button>

                    {/* Mobile Menu Toggle */}
                    {isMobile && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={cn(isMobileMenuOpen && "bg-accent")}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobile && isMobileMenuOpen && (
                <div className="absolute top-14 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b shadow-lg p-4 flex flex-col gap-4 animate-in slide-in-from-top-2">
                    {onNewSession && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{t('common.newSession', 'New session')}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    onNewSession();
                                    setIsMobileMenuOpen(false);
                                }}
                            >
                                <SquarePen className="h-4 w-4 mr-2" />
                                <span>{t('common.newSession', 'New session')}</span>
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('common.theme')}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onToggleTheme}
                            className="w-[80px]"
                        >
                            {theme === "light" && <Sun className="h-4 w-4 mr-2" />}
                            {theme === "dark" && <Moon className="h-4 w-4 mr-2" />}
                            {theme === "system" && <Monitor className="h-4 w-4 mr-2" />}
                            <span className="capitalize">{theme}</span>
                        </Button>
                    </div>

                    {onToggleTimeline && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{t('common.toggleTimeline', 'Activity timeline')}</span>
                            <Button
                                variant={showTimeline ? "default" : "outline"}
                                size="sm"
                                onClick={onToggleTimeline}
                            >
                                <Activity className="h-4 w-4 mr-2" />
                                <span>{showTimeline ? "On" : "Off"}</span>
                            </Button>
                        </div>
                    )}

                    <div className="h-px bg-border" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary">
                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{user?.displayName || 'User'}</span>
                                <span className="text-xs text-muted-foreground">{user?.email}</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            title="Sign out"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-hidden relative">
                <PanelGroup direction={isMobile ? "vertical" : "horizontal"}>
                    {/* Left Panel: Main Content (Workflow Dashboard) */}
                    <Panel defaultSize={isMobile ? 60 : 50} minSize={30}>
                        <div className="h-full flex flex-col relative overflow-hidden">
                            {children}
                        </div>
                    </Panel>

                    <PanelResizeHandle className={cn(
                        "bg-border hover:bg-primary/50 transition-colors flex items-center justify-center group z-40",
                        isMobile ? "h-1 w-full my-0.5 cursor-row-resize" : "w-1 h-full mx-0.5 cursor-col-resize"
                    )}>
                        <div className={cn(
                            "bg-muted-foreground/20 rounded-full group-hover:bg-primary/80 transition-colors",
                            isMobile ? "w-8 h-1" : "h-8 w-1"
                        )} />
                    </PanelResizeHandle>

                    {/* Right Panel: Chat Sidebar */}
                    <Panel
                        ref={sidebarRef}
                        defaultSize={isMobile ? 40 : 50}
                        minSize={15}
                        maxSize={isMobile ? 80 : 70}
                        collapsible={true}
                        collapsedSize={0}
                        onCollapse={() => setIsSidebarOpen(false)}
                        onExpand={() => setIsSidebarOpen(true)}
                        className={cn(
                            "bg-card transition-all duration-300 ease-in-out",
                            isMobile ? "border-t" : "border-l",
                            !isSidebarOpen && (isMobile ? "min-h-0 border-t-0" : "min-w-0 border-l-0")
                        )}
                    >
                        <div className="h-full overflow-hidden">
                            {sidebar}
                        </div>
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
}
