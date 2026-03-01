#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const SUPABASE_CONFIG_PATH = resolve(ROOT, "supabase", "config.toml");
const SUPABASE_COMPOSE_PATH = resolve(
  ROOT,
  "supabase",
  ".temp",
  "docker",
  "docker-compose.yml"
);

function run(command, options = {}) {
  return execSync(command, {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    ...options,
  });
}

function runInherit(command) {
  execSync(command, {
    cwd: ROOT,
    stdio: "inherit",
    encoding: "utf8",
  });
}

function commandExists(command) {
  try {
    run(`command -v ${command}`);
    return true;
  } catch {
    return false;
  }
}

function getProjectId() {
  if (!existsSync(SUPABASE_CONFIG_PATH)) return "supabase";
  const config = readFileSync(SUPABASE_CONFIG_PATH, "utf8");
  const match = config.match(/^\s*project_id\s*=\s*"([^"]+)"/m);
  return match?.[1] || "supabase";
}

function parseComposeImages() {
  if (!existsSync(SUPABASE_COMPOSE_PATH)) return [];
  const compose = readFileSync(SUPABASE_COMPOSE_PATH, "utf8");
  const images = new Set();
  const regex = /^\s*image:\s*("?)([^\s"]+)\1\s*$/gm;
  let match;

  while ((match = regex.exec(compose)) !== null) {
    if (match[2]) images.add(match[2]);
  }

  return Array.from(images);
}

function removeImages(images) {
  if (images.length === 0) {
    console.log(
      "[teardown-demo] Nenhuma imagem encontrada no compose local. Pulando remoção de imagens."
    );
    return;
  }

  console.log(
    `[teardown-demo] Tentando remover ${images.length} imagem(ns) do stack local...`
  );

  for (const image of images) {
    try {
      runInherit(`docker image rm -f ${image}`);
    } catch (error) {
      console.log(
        `[teardown-demo] Aviso: não foi possível remover imagem ${image} (pode estar em uso por outro projeto).`
      );
    }
  }
}

function removeAllSupabaseImages() {
  try {
    const ids = run(
      `docker images --filter=reference='supabase/*' --format '{{.ID}}'`
    )
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      console.log(
        "[teardown-demo] Nenhuma imagem supabase/* encontrada para limpeza global."
      );
      return;
    }

    console.log(
      `[teardown-demo] Removendo ${ids.length} imagem(ns) supabase/* (modo agressivo)...`
    );

    for (const id of ids) {
      try {
        runInherit(`docker image rm -f ${id}`);
      } catch {
        console.log(
          `[teardown-demo] Aviso: não foi possível remover imagem ${id}.`
        );
      }
    }
  } catch {
    console.log(
      "[teardown-demo] Aviso: falha ao listar imagens supabase/* para limpeza global."
    );
  }
}

function main() {
  if (!commandExists("supabase")) {
    console.error(
      "[teardown-demo] Supabase CLI não encontrado. Instale com `brew install supabase/tap/supabase`."
    );
    process.exit(1);
  }

  if (!commandExists("docker")) {
    console.error(
      "[teardown-demo] Docker não encontrado. Instale o Docker Desktop e tente novamente."
    );
    process.exit(1);
  }

  const projectId = getProjectId();
  const images = parseComposeImages();
  const aggressive = process.argv.includes("--aggressive");

  console.log(
    `[teardown-demo] Encerrando stack local do projeto "${projectId}" e removendo volumes...`
  );
  runInherit(`supabase stop --project-id ${projectId} --no-backup --yes`);

  removeImages(images);
  if (aggressive) {
    removeAllSupabaseImages();
  }

  console.log(
    "[teardown-demo] Limpeza concluída. Containers, volumes e imagens do stack local foram processados."
  );
}

main();
