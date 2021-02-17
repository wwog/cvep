import { protocol } from "electron";
import { join, extname } from "path";
import { readFile } from "fs";
import { URL } from "url";
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);
export default (scheme: string) => {
  protocol.registerBufferProtocol(scheme, (req, res) => {
    let pathName = new URL(req.url).pathname;
    pathName = decodeURI(pathName);
    readFile(join(__dirname, pathName), (e, data) => {
      if (e) {
        console.error(`Failed to read ${pathName} on ${scheme} protocol`);
      }
      const extension = extname(pathName).toLowerCase();
      let mimeType = "";
      switch (extension) {
        case ".js":
          mimeType = "text/javascript";
          break;
        case ".html":
          mimeType = "text/html";
          break;
        case ".css":
          mimeType = "text/css";
          break;
        case ".svg":
        case ".svgz":
          mimeType = "image/svg+xml";
          break;
        case ".json":
          mimeType = "application/json";
          break;
        case ".wasm":
          mimeType = "application/wasm";
      }
      res({ mimeType, data });
    });
  });
};
