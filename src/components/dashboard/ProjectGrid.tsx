'use client';

import { motion } from 'motion/react';
import type { ProjectMeta } from '@/types/project';
import { ProjectCard } from './ProjectCard';

interface Props {
  projects: ProjectMeta[];
  onRefresh: () => void;
}

export function ProjectGrid({ projects, onRefresh }: Props) {
  return (
    <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <ProjectCard project={project} onRefresh={onRefresh} />
        </motion.div>
      ))}
    </div>
  );
}
