"use client";

import { useState } from "react";

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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { deleteProjectAction } from "../actions";

type DeleteProjectFormProps = {
  projectId: string;
  projectTitle: string;
};

export function DeleteProjectForm({ projectId, projectTitle }: DeleteProjectFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation === projectTitle;

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-admin-section-title font-normal tracking-[-0.02em]">Zona de perigo</CardTitle>
        <CardDescription className="max-w-2xl text-admin-body leading-6">
          Apagar este projeto remove a página e seus blocos. Os arquivos enviados não serão apagados do armazenamento agora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setConfirmation("");
            }
          }}
        >
          <AlertDialogTrigger
            render={(
              <Button
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
              <Field className="mb-6">
                <FieldLabel className="text-admin-label uppercase tracking-[0.14em]" htmlFor="delete-project-confirmation">
                  Digite o nome do projeto para confirmar
                </FieldLabel>
                <Input
                  aria-describedby="delete-project-confirmation-description"
                  autoComplete="off"
                  id="delete-project-confirmation"
                  name="deleteProjectConfirmation"
                  onChange={(event) => setConfirmation(event.target.value)}
                  value={confirmation}
                />
                <FieldDescription className="text-admin-help leading-5" id="delete-project-confirmation-description">
                  O botão de apagar será liberado somente quando o nome estiver igual ao título do projeto.
                </FieldDescription>
              </Field>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction disabled={!canDelete} type="submit" variant="destructive">
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
