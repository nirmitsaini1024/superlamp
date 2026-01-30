"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Github, Edit3, Info, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Repository } from "@/hooks/useRepos";

interface ProjectSetupFormProps {
  repo: Repository;
}

interface EnvironmentVariable {
  key: string;
  value: string;
}

export function ProjectSetupForm({ repo }: ProjectSetupFormProps) {
  const router = useRouter();
  const [buildSettingsOpen, setBuildSettingsOpen] = useState(false);
  const [envVariablesOpen, setEnvVariablesOpen] = useState(false);
  const [framework, setFramework] = useState("nextjs");
  const [rootDirectory, setRootDirectory] = useState("./");

  // Build settings state
  const [buildCommand, setBuildCommand] = useState("");
  const [outputDirectory, setOutputDirectory] = useState("");
  const [installCommand, setInstallCommand] = useState("");
  const [buildCommandEnabled, setBuildCommandEnabled] = useState(false);
  const [outputDirectoryEnabled, setOutputDirectoryEnabled] = useState(false);
  const [installCommandEnabled, setInstallCommandEnabled] = useState(false);

  // Environment variables state
  const [envVariables, setEnvVariables] = useState<EnvironmentVariable[]>([
    { key: "EXAMPLE_NAME", value: "I9JU23NF394R6HH" },
  ]);

  // Extract username and repo name from full_name
  const [username, repoName] = repo.full_name.split("/");

  const addEnvironmentVariable = () => {
    setEnvVariables([...envVariables, { key: "", value: "" }]);
  };

  const removeEnvironmentVariable = (index: number) => {
    setEnvVariables(envVariables.filter((_, i) => i !== index));
  };

  const updateEnvironmentVariable = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updated = [...envVariables];
    updated[index][field] = value;
    setEnvVariables(updated);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-card border border-border rounded-lg p-6">
      <h1 className="text-2xl font-semibold text-card-foreground mb-6">
        New Project
      </h1>

      {/* Import Section */}
      <div className="mb-6">
        <p className="text-muted-foreground text-sm mb-3">
          Importing from GitHub
        </p>
        <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-md">
          <Github className="w-5 h-5 text-muted-foreground" />
          <span className="text-foreground">{repo.full_name}</span>
          <div className="flex items-center gap-1 text-muted-foreground text-sm ml-auto">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span>main</span>
          </div>
        </div>
      </div>

      <p className="text-muted-foreground mb-6">
        Choose where you want to create the project and give it a name.
      </p>

      {/* Team and Project Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-muted-foreground text-sm mb-2">
            Vercel Team
          </label>
          <Select defaultValue="hobby">
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{username}'s projects</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              <SelectItem value="hobby" className="text-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{username}'s projects</span>
                  <span className="text-muted-foreground ml-auto">Hobby</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-muted-foreground text-sm mb-2">
            Project Name
          </label>
          <Input
            defaultValue={`${repoName}-${Math.random()
              .toString(36)
              .substring(2, 6)}`}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Framework Preset */}
      <div className="mb-6">
        <label className="block text-muted-foreground text-sm mb-2">
          Framework Preset
        </label>
        <Select value={framework} onValueChange={setFramework}>
          <SelectTrigger className="bg-background border-border text-foreground">
            <SelectValue>
              <div className="flex items-center gap-2">
                {framework === "nextjs" && (
                  <div className="w-5 h-5 bg-black dark:bg-white rounded-full flex items-center justify-center text-xs font-bold text-white dark:text-black">
                    N
                  </div>
                )}
                {framework === "react" && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    R
                  </div>
                )}
                {framework === "vite" && (
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    V
                  </div>
                )}
                <span>
                  {framework === "nextjs" && "Next.js"}
                  {framework === "react" && "React"}
                  {framework === "vite" && "Vite"}
                </span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            <SelectItem value="nextjs" className="text-foreground">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-black dark:bg-white rounded-full flex items-center justify-center text-xs font-bold text-white dark:text-black">
                  N
                </div>
                <span>Next.js</span>
              </div>
            </SelectItem>
            <SelectItem value="react" className="text-foreground">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  R
                </div>
                <span>React</span>
              </div>
            </SelectItem>
            <SelectItem value="vite" className="text-foreground">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  V
                </div>
                <span>Vite</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Root Directory */}
      <div className="mb-6">
        <label className="block text-muted-foreground text-sm mb-2">
          Root Directory
        </label>
        <div className="flex gap-2">
          <Input
            value={rootDirectory}
            onChange={(e) => setRootDirectory(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            className="bg-background border-border text-foreground hover:bg-accent"
            onClick={() => setRootDirectory("./")}
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Build and Output Settings */}
      <div className="mb-6">
        <button
          onClick={() => setBuildSettingsOpen(!buildSettingsOpen)}
          className="w-full flex items-center gap-2 p-3 bg-muted border border-border rounded-md text-left text-foreground hover:bg-accent transition-colors"
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform ${
              buildSettingsOpen ? "rotate-90" : ""
            }`}
          />
          <span>Build and Output Settings</span>
        </button>

        {buildSettingsOpen && (
          <div className="mt-2 space-y-4 p-4 bg-muted/50 border border-border rounded-md">
            {/* Build Command */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm text-muted-foreground">
                    Build Command
                  </label>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  value={buildCommand}
                  onChange={(e) => setBuildCommand(e.target.value)}
                  placeholder="'npm run build' or 'next build'"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  disabled={!buildCommandEnabled}
                />
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => setBuildCommandEnabled(!buildCommandEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    buildCommandEnabled
                      ? "bg-primary"
                      : "bg-muted-foreground/20"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      buildCommandEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Output Directory */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm text-muted-foreground">
                    Output Directory
                  </label>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  value={outputDirectory}
                  onChange={(e) => setOutputDirectory(e.target.value)}
                  placeholder="Next.js default"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  disabled={!outputDirectoryEnabled}
                />
              </div>
              <div className="flex items-center">
                <button
                  onClick={() =>
                    setOutputDirectoryEnabled(!outputDirectoryEnabled)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    outputDirectoryEnabled
                      ? "bg-primary"
                      : "bg-muted-foreground/20"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      outputDirectoryEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Install Command */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm text-muted-foreground">
                    Install Command
                  </label>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  value={installCommand}
                  onChange={(e) => setInstallCommand(e.target.value)}
                  placeholder="'yarn install', 'pnpm install', 'npm install', or 'bun install'"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  disabled={!installCommandEnabled}
                />
              </div>
              <div className="flex items-center">
                <button
                  onClick={() =>
                    setInstallCommandEnabled(!installCommandEnabled)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    installCommandEnabled
                      ? "bg-primary"
                      : "bg-muted-foreground/20"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      installCommandEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Environment Variables */}
      <div className="mb-6">
        <button
          onClick={() => setEnvVariablesOpen(!envVariablesOpen)}
          className="w-full flex items-center gap-2 p-3 bg-muted border border-border rounded-md text-left text-foreground hover:bg-accent transition-colors"
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform ${
              envVariablesOpen ? "rotate-90" : ""
            }`}
          />
          <span>Environment Variables</span>
        </button>

        {envVariablesOpen && (
          <div className="mt-2 space-y-4 p-4 bg-muted/50 border border-border rounded-md">
            {envVariables.map((envVar, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm text-muted-foreground mb-2">
                    Key
                  </label>
                  <Input
                    value={envVar.key}
                    onChange={(e) =>
                      updateEnvironmentVariable(index, "key", e.target.value)
                    }
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm text-muted-foreground">
                      Value
                    </label>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Input
                    value={envVar.value}
                    onChange={(e) =>
                      updateEnvironmentVariable(index, "value", e.target.value)
                    }
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEnvironmentVariable(index)}
                    className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addEnvironmentVariable}
              className="w-full border-dashed border-border text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add More
            </Button>

            <p className="text-xs text-muted-foreground">
              Tip: Paste an .env above to populate the form.{" "}
              <a href="#" className="text-primary hover:underline">
                Learn more
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Deploy Button */}
      <Button 
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3"
        onClick={() => router.push(`/${username}/project/${repoName}`)}
      >
        Deploy
      </Button>
    </div>
  );
}
