"use client";

import { ProjectImage } from "../ProjectMediaFallback";

export type ContactCreditProject = {
  clientArchitectEmail: string | null;
  clientArchitectInstagram: string | null;
  clientArchitectName: string | null;
  clientArchitectPhone: string | null;
  clientArchitectWebsite: string | null;
  title: string;
};

export type ContactCreditMediaAsset = {
  altText: string | null;
  url: string;
} | null;

type ProjectContactCreditFooterProps = {
  body?: string | null;
  mediaAsset?: ContactCreditMediaAsset;
  project: ContactCreditProject;
  title?: string | null;
  titleId: string;
};

export function ProjectContactCreditFooter({
  body,
  mediaAsset,
  project,
  title,
  titleId,
}: ProjectContactCreditFooterProps) {
  const contacts = [
    { href: emailHref(project.clientArchitectEmail), label: "Email", value: project.clientArchitectEmail },
    { href: phoneHref(project.clientArchitectPhone), label: "Telefone", value: project.clientArchitectPhone },
    { href: project.clientArchitectWebsite, label: "Website", value: project.clientArchitectWebsite },
    { href: project.clientArchitectInstagram, label: "Instagram", value: project.clientArchitectInstagram },
  ].filter((contact) => contact.value);

  return (
    <footer
      aria-labelledby={titleId}
      className="bg-[var(--ink)] px-5 py-20 text-white sm:px-8 sm:py-28 lg:px-16"
      data-header-theme="light"
    >
      <div className="mx-auto grid max-w-[1440px] gap-12 border-t border-white/18 pt-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="text-[var(--text-label)] font-medium uppercase tracking-[0.16em] text-white/45">
            Contato / credito
          </p>
          <h2
            className="mt-5 font-[var(--font-display)] text-[var(--text-h2)] font-normal leading-[1] tracking-[-0.045em]"
            id={titleId}
          >
            {title ?? project.clientArchitectName ?? project.title}
          </h2>
          {body ? (
            <p className="mt-6 max-w-xl whitespace-pre-line text-[var(--text-body)] leading-7 text-white/68">
              {body}
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          {mediaAsset ? (
            <ProjectImage
              alt={mediaAsset.altText ?? ""}
              className="mb-8 aspect-[4/5] w-full max-w-sm object-cover grayscale"
              placeholderClassName="mb-8 aspect-[4/5] w-full max-w-sm"
              src={mediaAsset.url}
              tone="dark"
            />
          ) : null}
          <dl className="grid gap-0">
            {project.clientArchitectName ? (
              <ContactRow label="Cliente / arquiteto" value={project.clientArchitectName} />
            ) : null}
            {contacts.map((contact) => (
              <ContactRow
                href={contact.href ?? undefined}
                key={contact.label}
                label={contact.label}
                value={formatContactValue(contact.value ?? "")}
              />
            ))}
          </dl>
          <p className="mt-12 text-[var(--text-label)] uppercase tracking-[0.18em] text-white/40">
            Produzido por Yann
          </p>
        </div>
      </div>
    </footer>
  );
}

function ContactRow({ href, label, value }: { href?: string; label: string; value: string }) {
  return (
    <div className="grid gap-2 border-b border-white/14 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
      <dt className="text-[var(--text-label)] font-medium uppercase tracking-[0.16em] text-white/42">
        {label}
      </dt>
      <dd className="text-sm leading-6 text-white/72">
        {href ? (
          <a className="underline decoration-white/28 underline-offset-4 hover:decoration-white" href={href}>
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function emailHref(value: string | null) {
  return value ? `mailto:${value}` : null;
}

function phoneHref(value: string | null) {
  return value ? `tel:${value.replace(/[^+\d]/g, "")}` : null;
}

function formatContactValue(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
