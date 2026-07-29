"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { deleteProjectAction } from "../actions";

type DeleteProjectFormProps = {
  projectId: string;
  projectTitle: string;
};

export function DeleteProjectForm({ projectId, projectTitle }: DeleteProjectFormProps) {
  return (
    <Card className="rounded-none border-destructive">
      <CardHeader>
        <CardTitle className="text-admin-section-title font-normal tracking-[-0.02em]">Zona de perigo</CardTitle>
        <CardDescription className="max-w-2xl text-admin-body leading-6">
          Apagar este projeto remove a página e seus blocos. Os arquivos enviados não serão apagados do armazenamento agora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger
            render={(
              <Button
                className="min-h-11 rounded-none px-5 text-admin-label uppercase tracking-[0.16em]"
                variant="destructive"
              />
            )}
          >
            Apagar projeto
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar definitivamente este projeto?</AlertDialogTitle>
              <AlertDialogDescription>
                O projeto {projectTitle} e seus blocos serão removidos. Os arquivos enviados permanecem no armazenamento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form action={deleteProjectAction}>
              <input name="projectId" type="hidden" value={projectId} />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction type="submit" variant="destructive">
                  Apagar projeto
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
