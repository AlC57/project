const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");

app.use(express.static("public"));

const waiting = {};
const groups = {};

io.on("connection", (socket) => {
  socket.on("join", ({ area, gender }) => {
    const key = \`\${area.toLowerCase()}-\${gender.toLowerCase()}\`;
    if (!waiting[key]) waiting[key] = [];

    waiting[key].push(socket);
    socket.join(key);

    io.to(key).emit("waiting_count", waiting[key].length);

    if (waiting[key].length >= 2) {
      const group = waiting[key].splice(0, 2);
      const groupId = \`group-\${Date.now()}\`;

      group.forEach((s) => {
        s.join(groupId);
        s.emit("group_formed", { groupId });
      });
      groups[groupId] = { users: group, meetup: null };
    }
  });

  socket.on("select_meetup", ({ groupId, location }) => {
    if (groups[groupId] && !groups[groupId].meetup) {
      groups[groupId].meetup = location;
      io.to(groupId).emit("meetup_selected", location);
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));