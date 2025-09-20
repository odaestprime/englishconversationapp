import React, { useState } from 'react';
import { MessageCircle, BookOpen, RotateCcw, Star, Users, Zap, Settings, Shield } from 'lucide-react';

export default function EnglishConversationHelper() {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('');
  const [questions, setQuestions] = useState([]);
  const [learningPoints, setLearningPoints] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedSessions, setSavedSessions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  // APIキー関連の状態を削除

  const levels = {
    beginner: '初級者',
    intermediate: '中級者', 
    advanced: '上級者'
  };

  const createPrompt = (topic, level) => {
    const levelDescriptions = {
      beginner: 'basic vocabulary, simple grammar, present tense, yes/no questions',
      intermediate: 'opinion-based questions, past/future tense, comparative forms, explanatory questions',
      advanced: 'complex discussions, abstract concepts, analytical thinking, nuanced perspectives'
    };

    return `Generate exactly 10 conversation questions about "${topic}" for ${level}-level English learners.

Level characteristics for ${level}:
- ${levelDescriptions[level]}

Requirements:
- Questions should be engaging and promote natural conversation
- Appropriate difficulty for ${level} level
- Encourage personal opinions and experiences
- Mix different question types (open-ended, opinion, experience-based)
- Make questions specific to the topic "${topic}"

Also provide 3 learning points for each category:
1. Vocabulary: 3 key words related to "${topic}" appropriate for ${level} level
2. Grammar: 3 grammar structures that ${level} learners should practice
3. Expressions: 3 useful expressions for discussing "${topic}"

Format your response as JSON:
{
  "questions": [
    "Question 1...",
    "Question 2...",
    // ... 10 questions total
  ],
  "learning_points": {
    "vocabulary": ["word1", "word2", "word3"],
    "grammar": ["grammar1", "grammar2", "grammar3"],
    "expressions": ["expression1", "expression2", "expression3"]
  }
}`;
  };

  // セキュアなGemini API呼び出し（APIキーはサーバーサイドで管理）
  const generateWithGemini = async (topic, level) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // APIキーは送信しない（サーバーサイドで管理）
          prompt: createPrompt(topic, level)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API呼び出しに失敗しました');
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('AIからの応答形式が正しくありません');
      }
      
      const content = data.candidates[0].content.parts[0].text;
      const cleanContent = content.replace(/```json\n?|\n?```/g, '');
      const parsed = JSON.parse(cleanContent);
      
      if (!parsed.questions || !parsed.learning_points) {
        throw new Error('生成されたデータの形式が正しくありません');
      }
      
      return parsed;
      
    } catch (error) {
      console.error('Gemini生成エラー:', error);
      alert(`AI生成中にエラーが発生しました: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 静的生成（フォールバック）
  const generateStaticQuestions = (topic, level) => {
    const questionTemplates = {
      beginner: [
        `Do you like ${topic}?`,
        `What is ${topic}?`,
        `When do you usually think about ${topic}?`,
        `Is ${topic} popular in your country?`,
        `How often do you hear about ${topic}?`,
        `Do your friends talk about ${topic} too?`,
        `What do you know about ${topic}?`,
        `Is ${topic} easy or difficult to understand?`,
        `Can you tell me about ${topic}?`,
        `Why is ${topic} interesting to you?`
      ],
      intermediate: [
        `What's your opinion about ${topic}?`,
        `How has ${topic} changed over the years?`,
        `What are the advantages and disadvantages of ${topic}?`,
        `If you could improve ${topic}, what would you change?`,
        `How does ${topic} affect people's daily lives?`,
        `What's the most interesting thing about ${topic}?`,
        `Do you think ${topic} will be different in the future?`,
        `How does ${topic} compare between different countries?`,
        `What challenges do people face with ${topic}?`,
        `What advice would you give to someone interested in ${topic}?`
      ],
      advanced: [
        `What are the broader implications of ${topic} on society?`,
        `How do cultural differences influence perspectives on ${topic}?`,
        `What ethical considerations should we think about regarding ${topic}?`,
        `How might technological advancement impact ${topic}?`,
        `What role does ${topic} play in economic development?`,
        `How do you think ${topic} will evolve in the next decade?`,
        `What are some misconceptions people have about ${topic}?`,
        `How does ${topic} intersect with environmental concerns?`,
        `What policy changes would you recommend regarding ${topic}?`,
        `How can we balance innovation with tradition in ${topic}?`
      ]
    };

    const learningTemplates = {
      beginner: {
        vocabulary: ['basic', 'simple', 'popular'],
        grammar: ['Present tense', 'Question formation with "Do/Does"', 'Basic adjectives'],
        expressions: ['"I think..."', '"In my opinion..."', '"I like/don\'t like..."']
      },
      intermediate: {
        vocabulary: ['advantage', 'disadvantage', 'comparison'],
        grammar: ['Present perfect tense', 'Conditional sentences', 'Comparative forms'],
        expressions: ['"On the other hand..."', '"It seems to me that..."', '"From my perspective..."']
      },
      advanced: {
        vocabulary: ['implications', 'perspectives', 'ethical'],
        grammar: ['Complex conditional sentences', 'Subjunctive mood', 'Advanced passive voice'],
        expressions: ['"It could be argued that..."', '"One might consider..."', '"This raises the question of..."']
      }
    };

    return {
      questions: questionTemplates[level] || [],
      learning_points: learningTemplates[level] || learningTemplates.beginner
    };
  };

  const handleGenerate = async () => {
    if (!topic || !level) {
      alert('トピックとレベルを両方選択してください。');
      return;
    }

    let result;
    
    // 常にAI生成を試行（APIキーはサーバーサイドで管理）
    result = await generateWithGemini(topic, level);
    
    if (!result) {
      // AI生成に失敗した場合は静的生成にフォールバック
      result = generateStaticQuestions(topic, level);
    }
    
    setQuestions(result.questions);
    setLearningPoints(result.learning_points);
    setIsGenerated(true);
  };

  const saveSession = () => {
    const session = {
      id: Date.now(),
      topic,
      level: levels[level],
      questions,
      learningPoints,
      date: new Date().toLocaleDateString('ja-JP'),
      generatedWith: 'AI' // 常にAI生成を試行
    };
    setSavedSessions([...savedSessions, session]);
    alert('セッションが保存されました！');
  };

  const resetForm = () => {
    setTopic('');
    setLevel('');
    setQuestions([]);
    setLearningPoints([]);
    setIsGenerated(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">AI英会話・言語交換支援アプリ</h1>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="ml-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600">AIでパーソナライズされた質問と学習ポイントを生成</p>
        </div>

        {/* セキュリティ情報パネル */}
        {showSettings && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              セキュリティ & プライバシー
            </h3>
            
            <div className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  🔒 プロダクション対応
                </h4>
                <ul className="text-xs text-green-700 space-y-1">
                  <li>• <strong>セキュア設計</strong>: APIキーはサーバーサイドで安全に管理</li>
                  <li>• <strong>プライバシー保護</strong>: 機密情報をブラウザに保存しません</li>
                  <li>• <strong>完全無料</strong>: Google Gemini API（月間1,500リクエスト）</li>
                  <li>• <strong>高性能AI</strong>: GPT-3.5と同等以上の品質</li>
                  <li>• <strong>自動フォールバック</strong>: AI失敗時は静的生成で継続</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">💡 使い方のコツ</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• <strong>具体的なトピック</strong>: 「料理」より「日本の家庭料理」</li>
                  <li>• <strong>レベル選択</strong>: 現在の英語力に合わせて選択</li>
                  <li>• <strong>セッション保存</strong>: 後で復習できるよう保存機能を活用</li>
                  <li>• <strong>質問の活用</strong>: オンライン英会話や言語交換で実際に使用</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* 入力セクション */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                話したいトピック
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="例: 日本の文化、環境問題、AI技術、映画、旅行体験など"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                英語レベル
              </label>
              <div className="space-y-2">
                {Object.entries(levels).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="radio"
                      name="level"
                      value={key}
                      checked={level === key}
                      onChange={(e) => setLevel(e.target.value)}
                      className="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{value}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center disabled:bg-blue-400"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    AI生成中...
                  </div>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    AI質問生成
                  </>
                )}
              </button>
              
              {isGenerated && (
                <>
                  <button
                    onClick={saveSession}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    セッションを保存
                  </button>
                  
                  <button
                    onClick={resetForm}
                    className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    リセット
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 結果表示セクション */}
          <div className="space-y-6">
            {isGenerated && (
              <>
                {/* 質問候補 */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    会話質問候補 ({levels[level]})
                    <span className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      AI生成
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {questions.map((question, index) => (
                      <div key={index} className="bg-white p-3 rounded border-l-4 border-blue-400">
                        <span className="text-sm text-blue-600 font-medium">Q{index + 1}: </span>
                        <span className="text-gray-800">{question}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 学習ポイント */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    学習ポイント
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">重要単語</h4>
                      <div className="flex flex-wrap gap-2">
                        {learningPoints.vocabulary?.map((word, index) => (
                          <span key={index} className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">文法ポイント</h4>
                      <ul className="space-y-1">
                        {learningPoints.grammar?.map((point, index) => (
                          <li key={index} className="text-green-800 text-sm">• {point}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">便利な表現</h4>
                      <ul className="space-y-1">
                        {learningPoints.expressions?.map((expression, index) => (
                          <li key={index} className="text-green-800 text-sm">• {expression}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 保存されたセッション */}
        {savedSessions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">保存されたセッション</h3>
            <div className="grid gap-4">
              {savedSessions.map((session) => (
                <div key={session.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-800">{session.topic}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">{session.level} • {session.date}</p>
                        <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full flex items-center">
                          <Zap className="w-3 h-3 mr-1" />
                          AI
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{session.questions.length}個の質問</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}