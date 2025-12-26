import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 4000;
const DATA_FILE = path.join(__dirname, "data.json");

const allowedOrigins = ["http://localhost:8081", "http://127.0.0.1:8081"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (origin && allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("혀용되지 않은 출처입니다."));
      }
    },
  })
);
app.use(express.json());

function loadPosts(callback) {
  fs.readFile(DATA_FILE, "utf-8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        const emptyArray = [];
        fs.writeFile(
          DATA_FILE,
          JSON.stringify(emptyArray, null, 2),
          (writeErr) => {
            if (writeErr) {
              console.error("파일 생성 중 오류:", writeErr);
              return callback([]);
            }
            console.log("data.json 파일이 없어 새로 생성했습니다.");
            return callback([]);
          }
        );
        return;
      } else {
        console.error("파일 읽기 오류:", err);
        return callback([]);
      }
    }

    try {
      const posts = JSON.parse(data);
      callback(posts);
    } catch (parseErr) {
      console.error("JSON 파싱 오류:", parseErr);
      callback([]);
    }
  });
}

function savePosts(posts, callback) {
  fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), (err) => {
    if (err) {
      console.error("파일 저장 오류:", err);
    }
    if (callback) callback();
  });
}

// 전체 게시물 조회
app.get("/timeline", (req, res) => {
  loadPosts((posts) => {
    res.json(posts);
  });
});

// 특정 ID의 게시물 조회
app.get("/timeline/:id", (req, res) => {
  const postId = parseInt(req.params.id, 10);
  if (isNaN(postId)) {
    return res.status(400).json({ error: "잘못된 ID 형식입니다." });
  }

  loadPosts((posts) => {
    const post = posts.find((p) => p.id === postId);
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ error: "포스트를 찾을 수 없습니다." });
    }
  });
});

// 새 게시물 등록
app.post("/timeline", (req, res) => {
  const { title, content, imageUrl, videoUrl, audioUrl } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "제목과 내용은 필수입니다." });
  }

  const newPost = {
    id: Date.now(),
    title,
    content,
    ...(imageUrl && { image: imageUrl }),
    ...(videoUrl && { video: videoUrl }),
    ...(audioUrl && { audio: audioUrl }),
  };

  loadPosts((posts) => {
    posts.unshift(newPost);
    savePosts(posts, () => {
      res.status(201).json(newPost);
    });
  });
});

app.listen(PORT, () => {
  console.log(`서버가 실행 중입니다: http://localhost:${PORT}`);
});
