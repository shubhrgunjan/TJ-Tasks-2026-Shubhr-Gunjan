import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '../types';
import { getProject } from '../services/projects';

interface ProjectContextType {
  currentProject: Project | null;
  setCurrentProjectId: (id: string | null) => void;
  refreshCurrentProject: () => Promise<void>;
  loadingProject: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);

  const refreshCurrentProject = async () => {
    if (currentProjectId) {
      setLoadingProject(true);
      try {
        const p = await getProject(currentProjectId);
        setCurrentProject(p);
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setLoadingProject(false);
      }
    } else {
      setCurrentProject(null);
    }
  };

  useEffect(() => {
    refreshCurrentProject();
  }, [currentProjectId]);

  return (
    <ProjectContext.Provider value={{ currentProject, setCurrentProjectId, refreshCurrentProject, loadingProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
