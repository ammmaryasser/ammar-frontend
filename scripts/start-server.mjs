import {cp, mkdir} from "node:fs/promises";
import {spawn} from "node:child_process";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const standalone=path.join(root,".next","standalone");
await mkdir(path.join(standalone,".next"),{recursive:true});
await cp(path.join(root,".next","static"),path.join(standalone,".next","static"),{recursive:true});
await cp(path.join(root,"public"),path.join(standalone,"public"),{recursive:true});
const index=process.argv.findIndex(v=>v==="-p" || v==="--port");
const port=index>=0?process.argv[index+1]:(process.env.PORT || "3000");
if(!/^\d+$/.test(port) || Number(port)<1 || Number(port)>65535) throw new Error("Invalid server port");
const server=spawn(process.execPath,[path.join(standalone,"server.js")],{cwd:root,stdio:"inherit",windowsHide:true,
  env:{...process.env,PORT:port,HOSTNAME:"127.0.0.1"}});
for(const signal of ["SIGINT","SIGTERM"])process.once(signal,()=>server.kill(signal));
server.once("error",error=>{console.error(error.message);process.exitCode=1;});
server.once("exit",code=>{process.exitCode=code ?? 1;});
