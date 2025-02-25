import { createServer } from "http";
import path from "path";
import { readFile, writeFile } from "fs/promises";

const PORT = 3000;
const basePath = path.resolve("./");
const dataFilePath = path.join(basePath, "data.json");

const serveFile = async (res, filename, contentType) => {
    try {
        const filePath = path.join(basePath, filename);
        const data = await readFile(filePath, "utf-8");
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    } catch (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 Page Not Found</h1>");
    }
};

const loadData = async () => {
    try {
        const data = await readFile(dataFilePath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        if (error.code === "ENOENT") {
            await writeFile(dataFilePath, JSON.stringify({}), "utf-8");
            return {};
        }
        console.error("Error loading data:", error.message);
        return {};
    }
};

const server = createServer(async (req, res) => {
    if (req.method === "GET") {
        if (req.url === "/") return serveFile(res, "index.html", "text/html");
        if (req.url === "/add") return serveFile(res, "add.html", "text/html");
        if (req.url === "/get") return serveFile(res, "get.html", "text/html");
    }

    if (req.method === "POST" && req.url === "/addData") {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", async () => {
            try {
                const { id, fname, lname } = JSON.parse(body);

                if (!id || !fname || !lname) {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    return res.end("Fill all the details.");
                }

                const fileData = await loadData();

                if (fileData[id]) {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    return res.end("ID already exists. Try another one.");
                }

                fileData[id] = { fname, lname };
                await writeFile(dataFilePath, JSON.stringify(fileData, null, 2), "utf-8");

                res.writeHead(200, { "Content-Type": "text/plain" });
                return res.end("Form submitted successfully.");
            } catch (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                return res.end("Server error: " + err.message);
            }
        });
    }

    if (req.method === "POST" && req.url === "/getData") {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", async () => {
            try {
                const { id } = JSON.parse(body);

                if (!id) {
                    res.writeHead(400, { "Content-Type": "text/plain" });
                    return res.end("Enter your ID.");
                }

                const data = await loadData();

                if (data[id]) {
                    console.log("Sending Data:", data[id]); // Debugging
                    res.writeHead(200, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify(data[id]));
                }

                res.writeHead(404, { "Content-Type": "text/plain" });
                return res.end("No data found for this ID.");
            } catch (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Server is not responding.");
            }
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});
