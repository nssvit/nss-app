"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const { toggleTheme } = useTheme();
    const router = useRouter();
    const { signOut } = useAuth();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setOpen(false)}
            />

            <Command className="command-palette relative w-full max-w-lg rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center border-b border-gray-700/50 px-3" cmdk-input-wrapper="">
                    <i className="fas fa-search text-gray-400 mr-2 text-lg"></i>
                    <Command.Input
                        placeholder="Type a command or search..."
                        className="flex h-14 w-full bg-transparent py-3 text-base outline-none placeholder:text-gray-500 text-gray-100"
                    />
                </div>

                <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2">
                    <Command.Empty className="py-6 text-center text-sm text-gray-500">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Navigation" className="text-xs font-medium text-gray-500 px-2 py-1.5 mb-1">
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/dashboard"))}
                            className="flex items-center px-2 py-2.5 rounded-lg text-sm text-gray-200 aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300 cursor-pointer transition-colors"
                        >
                            <i className="fas fa-border-all w-5 mr-2 text-center"></i>
                            Dashboard
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/events"))}
                            className="flex items-center px-2 py-2.5 rounded-lg text-sm text-gray-200 aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300 cursor-pointer transition-colors"
                        >
                            <i className="fas fa-calendar-check w-5 mr-2 text-center"></i>
                            Events
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/volunteers"))}
                            className="flex items-center px-2 py-2.5 rounded-lg text-sm text-gray-200 aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300 cursor-pointer transition-colors"
                        >
                            <i className="fas fa-users w-5 mr-2 text-center"></i>
                            Volunteers
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/reports"))}
                            className="flex items-center px-2 py-2.5 rounded-lg text-sm text-gray-200 aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300 cursor-pointer transition-colors"
                        >
                            <i className="fas fa-chart-pie w-5 mr-2 text-center"></i>
                            Reports
                        </Command.Item>
                    </Command.Group>

                    <Command.Separator className="my-1 h-px bg-gray-700/50" />

                    <Command.Group heading="Actions" className="text-xs font-medium text-gray-500 px-2 py-1.5 mb-1 mt-1">
                        <Command.Item
                            onSelect={() => runCommand(() => toggleTheme())}
                            className="flex items-center px-2 py-2.5 rounded-lg text-sm text-gray-200 aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300 cursor-pointer transition-colors"
                        >
                            <i className="fas fa-adjust w-5 mr-2 text-center"></i>
                            Toggle Theme
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => console.log("Create Event"))}
                            className="flex items-center px-2 py-2.5 rounded-lg text-sm text-gray-200 aria-selected:bg-indigo-500/20 aria-selected:text-indigo-300 cursor-pointer transition-colors"
                        >
                            <i className="fas fa-plus w-5 mr-2 text-center"></i>
                            Create New Event
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => signOut())}
                            className="flex items-center px-2 py-2.5 rounded-lg text-sm text-red-400 aria-selected:bg-red-500/10 aria-selected:text-red-300 cursor-pointer transition-colors"
                        >
                            <i className="fas fa-sign-out-alt w-5 mr-2 text-center"></i>
                            Sign Out
                        </Command.Item>
                    </Command.Group>
                </Command.List>

                <div className="border-t border-gray-700/50 px-4 py-2 flex items-center justify-between text-[10px] text-gray-500 bg-gray-800/30">
                    <div className="flex gap-2">
                        <span><kbd className="bg-gray-700/50 px-1.5 py-0.5 rounded text-gray-400">↵</kbd> to select</span>
                        <span><kbd className="bg-gray-700/50 px-1.5 py-0.5 rounded text-gray-400">↑↓</kbd> to navigate</span>
                    </div>
                    <span><kbd className="bg-gray-700/50 px-1.5 py-0.5 rounded text-gray-400">esc</kbd> to close</span>
                </div>
            </Command>
        </div>
    );
}
