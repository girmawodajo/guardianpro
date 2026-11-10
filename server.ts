process.env.DISABLE_HMR = "true";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { buildApkBuffer } from "./server/apkGenerator";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini client lazily/safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // APK Download Endpoints
  app.get("/api/download/info", async (_req, res) => {
    try {
      const companion = await buildApkBuffer(true);
      const parent = await buildApkBuffer(false);
      res.json({
        companion: companion.meta,
        parent: parent.meta,
        downloadUrlCompanion: "/api/download/guardianpath-companion.apk",
        downloadUrlParent: "/api/download/guardianpath-parent.apk",
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load APK metadata", details: err?.message });
    }
  });

  app.get(
    [
      "/api/download/guardianpath-companion.apk",
      "/api/download/GuardianPath-Child-Companion-v2.4.2.apk",
      "/api/download/latest.apk",
      "/downloads/GuardianPath-Child-Companion-v2.4.2.apk",
      "/downloads/guardianpath-companion.apk",
    ],
    async (_req, res) => {
      try {
        const { buffer, meta } = await buildApkBuffer(true);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length");
        res.setHeader("Content-Type", "application/vnd.android.package-archive");
        res.setHeader("Content-Disposition", `attachment; filename="${meta.filename}"`);
        res.setHeader("Content-Length", buffer.length);
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.send(buffer);
      } catch (err: any) {
        res.status(500).send("Error generating companion APK: " + (err?.message || ""));
      }
    }
  );

  app.get(
    [
      "/api/download/guardianpath-parent.apk",
      "/api/download/GuardianPath-Parent-Console-v2.4.2.apk",
      "/downloads/GuardianPath-Parent-Console-v2.4.2.apk",
      "/downloads/guardianpath-parent.apk",
    ],
    async (_req, res) => {
      try {
        const { buffer, meta } = await buildApkBuffer(false);
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Type, Content-Length");
        res.setHeader("Content-Type", "application/vnd.android.package-archive");
        res.setHeader("Content-Disposition", `attachment; filename="${meta.filename}"`);
        res.setHeader("Content-Length", buffer.length);
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.send(buffer);
      } catch (err: any) {
        res.status(500).send("Error generating parent APK: " + (err?.message || ""));
      }
    }
  );

  // 1. AI URL & Content Safety Analyzer
  app.post("/api/ai/analyze-url", async (req, res) => {
    try {
      const { url, kidAge, category } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL or domain is required" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback rule-based estimation if no API key present
        const isEdu = url.includes("edu") || url.includes("khan") || url.includes("wiki") || url.includes("duolingo");
        const isSocial = url.includes("tiktok") || url.includes("instagram") || url.includes("reddit");
        const isGame = url.includes("roblox") || url.includes("minecraft") || url.includes("steam");

        return res.json({
          url,
          domain: url.replace(/https?:\/\//, "").split("/")[0],
          safetyScore: isEdu ? 95 : isSocial ? 45 : isGame ? 75 : 80,
          rating: isEdu ? "Safe" : isSocial ? "Caution" : "Safe",
          ageRating: isEdu ? "3+" : isSocial ? "13+" : "7+",
          categories: isEdu ? ["Education"] : isSocial ? ["Social Media"] : isGame ? ["Gaming"] : ["General Web"],
          summary: `Rule-based evaluation for ${url}. Site contains content suitable for ages ${isSocial ? "13+" : "7+"}.`,
          recommendedAction: isSocial && Number(kidAge || 10) < 13 ? "block" : "allow",
          reasons: [
            isEdu ? "Educational value detected" : "Standard web platform",
            isSocial ? "Contains user-generated content and live social interaction" : "No high-risk indicators found",
          ],
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Evaluate the following website URL/domain for child safety and age appropriateness for a kid aged ${kidAge || 10}:
URL: "${url}" ${category ? `(Claimed Category: ${category})` : ""}

Analyze potential risks (adult content, violence, cyberbullying, phishing, unmonitored chat, gambling, distractibility) and educational benefits.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING },
              domain: { type: Type.STRING },
              safetyScore: { type: Type.NUMBER, description: "0 to 100 safety score (100 is completely safe)" },
              rating: { type: Type.STRING, description: "Safe, Caution, or Unsafe" },
              ageRating: { type: Type.STRING, description: "Minimum recommended age like 3+, 7+, 13+, 18+" },
              categories: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of relevant content categories",
              },
              summary: { type: Type.STRING, description: "2-3 sentence clear summary for parents" },
              recommendedAction: { type: Type.STRING, description: "allow, block, or time_limit" },
              reasons: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key bullet points explaining the decision",
              },
            },
            required: ["url", "domain", "safetyScore", "rating", "ageRating", "categories", "summary", "recommendedAction", "reasons"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err: any) {
      console.error("Error in analyze-url:", err);
      return res.status(500).json({ error: err.message || "Failed to analyze URL" });
    }
  });

  // 2. AI Screen Time & Schedule Coach
  app.post("/api/ai/screen-time-recommendations", async (req, res) => {
    try {
      const { kidName, age, grade, interests } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          kidName: kidName || "Child",
          dailyLimitMinutes: age < 12 ? 120 : 180,
          breakdown: [
            { category: "Educational", limitMinutes: age < 12 ? 90 : 120, advice: "Encourage active problem solving & learning" },
            { category: "Gaming", limitMinutes: 45, advice: "Limit to post-homework sessions" },
            { category: "Video Streaming", limitMinutes: 45, advice: "Ensure YouTube Kids / restricted mode is enabled" },
            { category: "Social & Chat", limitMinutes: age < 12 ? 0 : 30, advice: "Keep social chat locked during night hours" },
          ],
          bedtimeSchedule: { start: age < 12 ? "20:30" : "21:30", end: "07:00" },
          wellnessTips: [
            "Implement a 'No screen in bedroom' rule 30 minutes before sleep.",
            "Reward completed homework with bonus 15 minutes of gaming.",
          ],
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Provide healthy, expert screen time guidelines and recommended schedule limits for a child named ${kidName || "Child"}, age ${age || 10}, in grade ${grade || "Elementary/Middle School"}. Their interests include: ${interests || "gaming, video watching, coding"}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              kidName: { type: Type.STRING },
              dailyLimitMinutes: { type: Type.NUMBER, description: "Total daily recommended screen time in minutes" },
              breakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    limitMinutes: { type: Type.NUMBER },
                    advice: { type: Type.STRING },
                  },
                  required: ["category", "limitMinutes", "advice"],
                },
              },
              bedtimeSchedule: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.STRING },
                  end: { type: Type.STRING },
                },
                required: ["start", "end"],
              },
              wellnessTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["kidName", "dailyLimitMinutes", "breakdown", "bedtimeSchedule", "wellnessTips"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err: any) {
      console.error("Error in screen-time-recommendations:", err);
      return res.status(500).json({ error: err.message || "Failed to get screen time recommendations" });
    }
  });

  // 3. AI Digital Wellness Report Digest
  app.post("/api/ai/safety-report", async (req, res) => {
    try {
      const { kidName, age, screenTimeMinutes, categories, alerts, locations } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          overallSafetyRating: "Good",
          wellnessScore: 88,
          summary: `${kidName} had a balanced digital day with ${screenTimeMinutes || 135} minutes of active device time. Learning activities comprised the majority of usage.`,
          highlights: [
            "Completed 60 minutes of Educational apps (Khan Academy & Duolingo).",
            "Arrived safely at school geofence on time.",
            "No high-risk website access attempts detected.",
          ],
          riskFactors: [
            "Approached maximum daily allowance for Roblox gaming.",
          ],
          screenTimeAdvice: "Slightly decrease evening gaming time to preserve bedtime routine.",
          recommendedSchedules: ["Keep 8:30 PM Bedtime Lock active"],
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Generate a comprehensive Parental Digital Safety & Wellness Digest Report for ${kidName} (Age ${age || 10}).
Today's statistics:
- Total Screen Time: ${screenTimeMinutes || 135} minutes
- Categories: ${JSON.stringify(categories || [])}
- Geofence & Location Alerts: ${JSON.stringify(alerts || [])}
- Recent check-ins: ${JSON.stringify(locations || [])}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallSafetyRating: { type: Type.STRING, description: "Excellent, Good, or Attention Needed" },
              wellnessScore: { type: Type.NUMBER, description: "0 to 100 score" },
              summary: { type: Type.STRING, description: "Overall 3-sentence summary for parent" },
              highlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Positive observations and good habits",
              },
              riskFactors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Items needing parent review or discussion",
              },
              screenTimeAdvice: { type: Type.STRING },
              recommendedSchedules: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["overallSafetyRating", "wellnessScore", "summary", "highlights", "riskFactors", "screenTimeAdvice", "recommendedSchedules"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err: any) {
      console.error("Error in safety-report:", err);
      return res.status(500).json({ error: err.message || "Failed to generate safety report" });
    }
  });

  // 4. AI Content Risk Scan (Text/Chat/Search inspect)
  app.post("/api/ai/flagged-scan", async (req, res) => {
    try {
      const { textSnippet } = req.body;
      if (!textSnippet) {
        return res.status(400).json({ error: "Text snippet is required" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        const containsRisk = /meet|secret|password|address|buy|kill|hate|naked/i.test(textSnippet);
        return res.json({
          textSnippet,
          isRiskFlagged: containsRisk,
          severity: containsRisk ? "warning" : "info",
          riskCategory: containsRisk ? "Potential Privacy / Stranger Danger" : "Standard Search",
          explanation: containsRisk ? "Contains sensitive phrases requesting location or private data." : "No explicit danger detected.",
          actionRecommended: containsRisk ? "Review recent chat log with child" : "No action needed",
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Analyze the following text message/search query string entered on a child's device for potential child safety risks:
Text: "${textSnippet}"

Assess risks like cyberbullying, predator grooming, personal data leaks, self-harm, explicit content, or phishing scams.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              textSnippet: { type: Type.STRING },
              isRiskFlagged: { type: Type.BOOLEAN },
              severity: { type: Type.STRING, description: "info, warning, or critical" },
              riskCategory: { type: Type.STRING },
              explanation: { type: Type.STRING },
              actionRecommended: { type: Type.STRING },
            },
            required: ["textSnippet", "isRiskFlagged", "severity", "riskCategory", "explanation", "actionRecommended"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err: any) {
      console.error("Error in flagged-scan:", err);
      return res.status(500).json({ error: err.message || "Failed to scan content" });
    }
  });

  // 5. AI Social Media Post & DM Safety Scanner
  app.post("/api/ai/social-scan", async (req, res) => {
    try {
      const { content, platform, sender, kidAge } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Social media content string is required" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        const containsBullying = /loser|ugly|hate|die|nobody likes|delete/i.test(content);
        const containsStranger = /password|meet|secret|photo|gift card|address|money|snap/i.test(content);
        const containsExplicit = /naked|sex|adult|porn|bad/i.test(content);

        let riskCategory = 'safe';
        let isFlagged = false;
        let aiSafetyScore = 95;
        let sentiment = 'positive';

        if (containsBullying) {
          riskCategory = 'cyberbullying';
          isFlagged = true;
          aiSafetyScore = 20;
          sentiment = 'toxic';
        } else if (containsStranger) {
          riskCategory = 'stranger_danger';
          isFlagged = true;
          aiSafetyScore = 25;
          sentiment = 'suspicious';
        } else if (containsExplicit) {
          riskCategory = 'adult_content';
          isFlagged = true;
          aiSafetyScore = 10;
          sentiment = 'toxic';
        }

        return res.json({
          content,
          platform: platform || 'social_media',
          sender: sender || 'Unknown',
          isFlagged,
          riskCategory,
          sentiment,
          aiSafetyScore,
          aiContextAdvice: isFlagged
            ? `Rule-based scan flagged potential ${riskCategory.replace('_', ' ')} risk on ${platform || 'social media'}. Recommend parent review.`
            : 'No direct cyberbullying or stranger risk detected in this social interaction.',
          recommendedParentAction: isFlagged ? 'blocked_contact' : 'none',
          detectedKeywords: isFlagged ? ['flagged_phrase'] : [],
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Perform an in-depth child digital safety & cyberbullying scan on this social media message/post/comment:
Platform: "${platform || 'Social Platform'}"
Sender/Author: "${sender || 'Unknown'}"
Child Age: ${kidAge || 12}
Message Content: "${content}"

Evaluate for:
1. Cyberbullying / Harassment / Hate speech
2. Predator grooming / Stranger danger / Soliciting photos or location
3. Self-harm / Mental health red flags
4. Adult / Explicit / NSFW material
5. Scam / Password phishing`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              platform: { type: Type.STRING },
              sender: { type: Type.STRING },
              isFlagged: { type: Type.BOOLEAN },
              riskCategory: {
                type: Type.STRING,
                description: "cyberbullying, stranger_danger, adult_content, self_harm, hate_speech, or safe",
              },
              sentiment: { type: Type.STRING, description: "positive, neutral, suspicious, or toxic" },
              aiSafetyScore: { type: Type.NUMBER, description: "0 to 100 safety score" },
              aiContextAdvice: { type: Type.STRING, description: "2-sentence guidance explaining the risk and advice for parents" },
              recommendedParentAction: {
                type: Type.STRING,
                description: "blocked_contact, warned_kid, removed_content, or none",
              },
              detectedKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key risk words detected in snippet",
              },
            },
            required: [
              "content",
              "platform",
              "sender",
              "isFlagged",
              "riskCategory",
              "sentiment",
              "aiSafetyScore",
              "aiContextAdvice",
              "recommendedParentAction",
              "detectedKeywords",
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err: any) {
      console.error("Error in social-scan:", err);
      return res.status(500).json({ error: err.message || "Failed to scan social content" });
    }
  });

  // 6. AI Child Device File & Storage Inspector
  app.post("/api/ai/file-scan", async (req, res) => {
    try {
      const { fileName, category, fileSizeMb, mimeType, textSnippet, kidAge } = req.body;
      if (!fileName) {
        return res.status(400).json({ error: "fileName is required for safety scan" });
      }

      const ai = getGeminiClient();
      if (!ai) {
        const isApk = /\.apk$/i.test(fileName) || mimeType?.includes('android.package-archive');
        const isCheat = /cheat|test_key|answers|leaked|exam/i.test(fileName + ' ' + (textSnippet || ''));
        const isPass = /password|secret|creds/i.test(fileName + ' ' + (textSnippet || ''));

        let riskLevel = 'safe';
        let isFlagged = false;
        let riskCategory = 'safe';

        if (isApk) {
          riskLevel = 'malicious';
          isFlagged = true;
          riskCategory = 'unverified_apk';
        } else if (isCheat) {
          riskLevel = 'suspicious';
          isFlagged = true;
          riskCategory = 'cheat_sheet';
        } else if (isPass) {
          riskLevel = 'suspicious';
          isFlagged = true;
          riskCategory = 'homework_doc';
        }

        return res.json({
          fileName,
          isFlagged,
          riskLevel,
          riskCategory,
          aiScanSummary: isFlagged
            ? `Rule-based scanner flagged ${fileName} as ${riskLevel.toUpperCase()} (${riskCategory}). Recommended parent review or quarantine.`
            : `File ${fileName} scanned safe for age ${kidAge || 12}.`,
          recommendedPermission: isFlagged ? 'blocked' : 'allowed',
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: `Analyze this child device file for safety, malware risk, academic dishonesty, explicit material, or security hazards:
File Name: "${fileName}"
Category: "${category || 'unknown'}"
File Size: ${fileSizeMb || 0} MB
Mime Type: "${mimeType || 'unknown'}"
Child Age: ${kidAge || 12}
Extracted Text Snippet: "${textSnippet || 'N/A'}"

Assess:
1. Is this a sideloaded/unverified APK with malware/spyware potential?
2. Does it contain leaked academic test answers / cheat sheets?
3. Does it expose sensitive login passwords in plaintext?
4. Does it pose an explicit or inappropriate risk for a child?`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fileName: { type: Type.STRING },
              isFlagged: { type: Type.BOOLEAN },
              riskLevel: {
                type: Type.STRING,
                description: "safe, suspicious, restricted, or malicious",
              },
              riskCategory: {
                type: Type.STRING,
                description: "nsfw_media, homework_doc, cheat_sheet, unverified_apk, personal_photo, audio_memo, or safe",
              },
              aiScanSummary: {
                type: Type.STRING,
                description: "2-sentence safety breakdown of file contents and risks",
              },
              recommendedPermission: {
                type: Type.STRING,
                description: "allowed, restricted, or blocked",
              },
            },
            required: [
              "fileName",
              "isFlagged",
              "riskLevel",
              "riskCategory",
              "aiScanSummary",
              "recommendedPermission",
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    } catch (err: any) {
      console.error("Error in file-scan:", err);
      return res.status(500).json({ error: err.message || "Failed to scan file" });
    }
  });


  // Vite middleware for development vs static production server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
