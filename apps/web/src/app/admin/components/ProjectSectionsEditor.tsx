import type { AdminMediaAsset } from "@/lib/api/admin-media";
import type { AdminProject, AdminProjectSection } from "@/lib/api/admin-projects";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

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
  const sectionOrder = sections.map((row) => row.section.id);

  return (
    <Card className="border-t-0">
      <CardHeader>
        <CardTitle className="text-admin-section-title font-normal tracking-[-0.02em]">Blocos da página</CardTitle>
        <CardDescription className="max-w-2xl text-admin-body leading-6">
          Monte a página do projeto com blocos em ordem. Novos blocos entram no final da página.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
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
                canMoveDown={index < sections.length - 1}
                canMoveUp={index > 0}
                mediaAssets={mediaAssets}
                projectId={project.id}
                section={row}
                sectionOrder={sectionOrder}
              />
            ))}
          </div>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>Nenhum bloco adicionado ainda</EmptyTitle>
              <EmptyDescription>
                Crie o primeiro bloco para começar a montar a narrativa da página do projeto.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
