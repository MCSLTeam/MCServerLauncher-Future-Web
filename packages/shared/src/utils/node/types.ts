import type { InstanceType } from "./instanceTypes.ts";

export type NodeType = "mcsl-daemon"; // | "mcsm" | "vanilla-ws" | "vanilla-rcon";

export type NodeStatus = "online" | "offline" | "connecting" | "reconnecting";

export type InstanceStatus = "running" | "stopped" | "starting" | "stopping";

export type InstanceInfo = {
  id: string;
  icon: string;
  name: string;
  type: InstanceType;
  status: InstanceStatus;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
};

export type InstanceSettings = {
  icon: string;
  name: string;
  type: InstanceType;
  mcVersion?: string; // only when mc instance
  loaderVersion?: string; // only when known instance, same as mcVersion when vanilla, program version when not mc instance
  startCommand: string;
  stopCommand: string;
  stdinEncoding: string;
  stdoutEncoding: string;
};

export type PlayerInfo = {
  name: string;
  uuid: string;
};

export type ModAuthorInfo =
  | {
      name: string;
      email?: string;
      homepage?: string;
    }
  | string;

export type ModInfo = {
  modid: string;
  version: string;
  icon?: string;
  name?: string;
  desc?: string;
  contributors?: ModAuthorInfo | ModAuthorInfo[];
  license?: string;
  relation?: {
    depends?: string[]; // modid
    breaks?: string[];
    conflicts?: string[];
    suggests?: string[];
    recommands?: string[];
    includes?: string[];
  };
  links?: {
    homepage?: string;
    source?: string;
    issue?: string;
  };
};

export type MCInstanceExtraInfo = {
  mcVersion: string;
  mcProtocolVersion: number;
  loaderVersion: string; // same as mcVersion when vanilla
  onlinePlayers?: string[]; // uuids
  players?: PlayerInfo[];
  ops?: {
    uuid: string;
    level: number;
    bypassPlayerLimit: boolean;
  }[];
  whitelist: {
    enabled: boolean;
    players: PlayerInfo[];
  };
  bannedPlayers: {
    player: PlayerInfo;
    expires: string;
  }[];
  bannedIps: {
    ip: string;
    expires: string;
  }[];
  mods: ModInfo[];
  plugins: ModInfo[];
};
