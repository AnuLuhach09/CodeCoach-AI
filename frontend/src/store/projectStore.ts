import { create } from 'zustand';

export interface Project {
  id: string;
  name: string;
  description?: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  path: string;
  content: string;
  mimeType: string;
  size: number;
  isIndexed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  id: string;
  projectId: string;
  title: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  files: ProjectFile[];
  activeFile: ProjectFile | null;
  chats: Chat[];
  activeChat: Chat | null;
  setProjects: (projects: Project[]) => void;
  setActiveProject: (project: Project | null) => void;
  setFiles: (files: ProjectFile[]) => void;
  setActiveFile: (file: ProjectFile | null) => void;
  setChats: (chats: Chat[]) => void;
  setActiveChat: (chat: Chat | null) => void;
  updateFileContent: (fileId: string, content: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProject: null,
  files: [],
  activeFile: null,
  chats: [],
  activeChat: null,
  setProjects: (projects) => set({ projects }),
  setActiveProject: (activeProject) => set({ activeProject, files: [], activeFile: null, chats: [], activeChat: null }),
  setFiles: (files) => set({ files }),
  setActiveFile: (activeFile) => set({ activeFile }),
  setChats: (chats) => set({ chats }),
  setActiveChat: (activeChat) => set({ activeChat }),
  updateFileContent: (fileId, content) =>
    set((state) => {
      const updatedFiles = state.files.map((f) =>
        f.id === fileId ? { ...f, content } : f
      );
      const updatedActiveFile =
        state.activeFile?.id === fileId
          ? { ...state.activeFile, content }
          : state.activeFile;
      return { files: updatedFiles, activeFile: updatedActiveFile };
    }),
}));
