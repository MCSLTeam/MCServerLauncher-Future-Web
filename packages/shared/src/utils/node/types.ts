import type { InstanceType } from "./instanceTypes.ts";

export type NodeType = "mcsl-daemon"; // | "mcsm" | "vanilla-ws" | "vanilla-rcon";

export type NodeStatus = "online" | "offline" | "connecting" | "reconnecting";

export type InstanceStatus =
  | "installing"
  | "running"
  | "stopped"
  | "starting"
  | "stopping"
  | "crashed";

export type InstanceInfo = {
  id: string;
  icon: string;
  name: string;
  type: InstanceType;
  status: InstanceStatus;
  gameVersion?: string;
  loaderVersion?: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  grouping?: string;
};

export type InstanceSettings = {
  icon: string;
  name: string;
  type: InstanceType;
  gameVersion?: string;
  loaderVersion?: string;
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
  mcProtocolVersion: number;
  onlinePlayers?: string[]; // uuid
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

export function isRunning(status: InstanceStatus) {
  return status === "running" || status === "starting" || status === "stopping";
}
