export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // 環境変数からAPIキーを取得（セキュア）
  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt } = req.body;

  // サーバーサイドでAPIキーをチェック
  if (!apiKey) {
    console.error('GEMINI_API_KEY環境変数が設定されていません');
    res.status(500).json({ 
      error: 'サーバー設定エラー: APIキーが設定されていません。管理者にお問い合わせください。' 
    });
    return;
  }

  if (!prompt) {
    res.status(400).json({ error: 'プロンプトが必要です' });
    return;
  }

  try {
    console.log('Gemini API呼び出し開始');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini APIエラー:', response.status, errorText);
      
      // ユーザーフレンドリーなエラーメッセージ
      let userMessage = 'AI生成中にエラーが発生しました。';
      if (response.status === 403) {
        userMessage = 'APIキーが無効です。管理者にお問い合わせください。';
      } else if (response.status === 429) {
        userMessage = 'リクエスト制限に達しました。しばらく待ってから再試行してください。';
      } else if (response.status === 400) {
        userMessage = 'リクエストの形式が正しくありません。';
      }
      
      throw new Error(userMessage);
    }

    const data = await response.json();
    console.log('Gemini API呼び出し成功');
    
    // レスポンスの検証
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('AIからの応答形式が正しくありません。');
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}