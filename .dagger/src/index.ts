import { argument, dag, Directory, func, object } from "@dagger.io/dagger";

@object()
export class Blog {
  /**
   * Build Astro site and return dist directory with OG cache
   */
  @func()
  async build(
    @argument({ defaultPath: "/" }) source: Directory,
  ): Promise<Directory> {
    const bunCache = dag.cacheVolume("bun");

    const built = dag
      .container()
      .from("oven/bun:latest")
      .withDirectory("/app", source)
      .withMountedCache("/root/.bun/install/cache", bunCache)
      .withWorkdir("/app")
      .withEnvVariable("CI", "true")
      .withExec(["bun", "install"])
      .withExec(["bun", "run", "build"]);

    // Export both dist and OG cache into a single output directory
    return dag
      .directory()
      .withDirectory("dist", built.directory("/app/dist"))
      .withDirectory(".cache/og", built.directory("/app/.cache/og"));
  }
}
