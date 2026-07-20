type UploadModalInertElement = {
  hasAttribute(name: string): boolean;
  removeAttribute(name: string): void;
  setAttribute(name: string, value: string): void;
};

type UploadModalFocusableElement = {
  focus(): void;
  hasAttribute(name: string): boolean;
  isConnected: boolean;
};

export function applyUploadModalInert<T extends UploadModalInertElement>(
  bodyChildren: T[],
  portalContainer: T,
) {
  const inertedChildren = bodyChildren.filter(
    (child) => child !== portalContainer && !child.hasAttribute("inert"),
  );

  for (const child of inertedChildren) {
    child.setAttribute("inert", "");
  }

  return inertedChildren;
}

export function clearUploadModalInert(elements: UploadModalInertElement[]) {
  for (const element of elements) {
    element.removeAttribute("inert");
  }
}

export function restoreUploadModalFocus(element: UploadModalFocusableElement | null) {
  if (element?.isConnected && !element.hasAttribute("disabled")) {
    element.focus();
  }
}
