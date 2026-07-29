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
    <section className="border border-border border-t-0 bg-card p-5 text-card-foreground md:p-6">
      <div>
        <h3 className="text-admin-section-title font-normal tracking-[-0.02em]">Blocos da página</h3>
        <p className="mt-2 max-w-2xl text-admin-body leading-6 text-muted-foreground">
          Monte a página do projeto com blocos em ordem. Novos blocos entram no final da página.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <ProjectSectionForm
          mediaAssets={mediaAssets}
          projectId={project.id}
          sectionCount={sections.length}
        />

        {sections.length > 0 ? (
          <div className="flex flex-col gap-5">
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
          <p className="border border-border px-4 py-3 text-admin-body text-muted-foreground">
            Nenhum bloco foi adicionado a este projeto ainda.
          </p>
        )}
      </div>
    </section>
  );
}
