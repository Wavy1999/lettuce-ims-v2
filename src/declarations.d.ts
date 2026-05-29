declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}
declare module "*.css" {
  const styles: { [key: string]: string };
  export default styles;
}

interface ImportMeta {
  readonly env: {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    [key: string]: string | undefined;
  };
}
