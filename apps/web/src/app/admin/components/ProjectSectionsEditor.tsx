import type { AdminMediaAsset } from "@/lib/api/admin-media";
import type { AdminProject, AdminProjectSection } from "@/lib/api/admin-projects";

import { ProjectSectionForm } from "./ProjectSectionForm";

type ProjectSectionsEditorProps = {
  mediaAssets: AdminMediaAsset[];
  project: AdminProject;
  sections: AdminProjectSection[];
};

export function ProjectSectionsEditor({
  mediaAssets,
  project,
  sections,
}: ProjectSectionsEditorProps) {
  return (
    <section className="border border-neutral-200 border-t-0 bg-white p-5 md:p-6">
      <div>
        <h3 className="text-admin-section-title font-normal tracking-[-0.02em]">Blocos da página</h3>
        <p className="mt-2 max-w-2xl text-admin-body leading-6 text-neutral-600">
          Monte a página do projeto com blocos em ordem. Novos blocos entram no final da página.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        <ProjectSectionForm
          mediaAssets={mediaAssets}
          projectId={project.id}
          sectionCount={sections.length}
        />

        {sections.length > 0 ? (
          <div className="space-y-5">
            {sections.map((row, index) => (
              <ProjectSectionForm
                key={row.section.id}
                displayOrder={index + 1}
                mediaAssets={mediaAssets}
                projectId={project.id}
                section={row}
              />
            ))}
          </div>
        ) : (
          <p className="border border-neutral-200 px-4 py-3 text-admin-body text-neutral-600">
            Nenhum bloco foi adicionado a este projeto ainda.
          </p>
        )}
      </div>
    </section>
  );
}
