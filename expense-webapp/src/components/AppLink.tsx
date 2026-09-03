import { forwardRef } from "react";
import type { AnchorHTMLAttributes } from "react";
import { Link as RouterLink } from "react-router-dom";

// Routes every Astryx <Link>/nav item through react-router's client-side
// navigation instead of a full-page load. Wired into <LinkProvider> once in
// main.tsx (astryx-design-system: "Navigation uses useLinkComponent()").
export const AppLink = forwardRef<
  HTMLAnchorElement,
  AnchorHTMLAttributes<HTMLAnchorElement>
>(({ href, ...props }, ref) => (
  <RouterLink ref={ref} to={href ?? "#"} {...props} />
));
AppLink.displayName = "AppLink";
