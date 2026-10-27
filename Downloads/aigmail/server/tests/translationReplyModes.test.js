import { beforeEach, describe, expect, it, vi } from 'vitest';

const provider = vi.hoisted(() => ({
  live: false,
  completeText: vi.fn(),
  completeJson: vi.fn(),
}));

vi.mock('../src/services/ai/openaiClient.js', () => ({
  isEnabled: () => provider.live,
  getActiveProvider: () => 'openai',
  completeText: provider.completeText,
  completeJson: provider.completeJson,
}));

import { generateReply, translateEmail } from '../src/services/ai/aiService.js';

const emailFor = (accountType) => ({
  id: `${accountType}-mail`,
  account: { provider: accountType },
  sender: 'editor@example.com',
  senderName: 'Editor',
  subject: 'Review request',
  body: 'Please review the attached report by Friday.',
});

beforeEach(() => {
  provider.live = false;
  provider.completeText.mockReset();
  provider.completeJson.mockReset();
});

describe.each(['MOCK', 'GMAIL'])('%s mailbox', (accountType) => {
  it('returns a clear setup error instead of a partial translation without an AI provider', async () => {
    await expect(translateEmail(emailFor(accountType), { targetLanguage: 'KN', scope: 'email' }))
      .rejects.toMatchObject({ code: 'TRANSLATION_NOT_CONFIGURED', statusCode: 503 });
    expect(provider.completeText).not.toHaveBeenCalled();
  });

  it('translates both requested sections through the configured provider', async () => {
    provider.live = true;
    provider.completeText.mockImplementation(async ({ user }) => ({
      text: user.includes('Tamil') ? 'வெள்ளிக்கிழமைக்குள் அறிக்கையை மதிப்பாய்வு செய்யவும்.' : 'ಶುಕ್ರವಾರದೊಳಗೆ ವರದಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.',
      model: 'test-model',
    }));

    for (const [targetLanguage, script] of [['KN', /[\u0C80-\u0CFF]/], ['TA', /[\u0B80-\u0BFF]/]]) {
      const result = await translateEmail(emailFor(accountType), {
        targetLanguage,
        scope: 'both',
        summary: { summary: 'Review the report by Friday.' },
      });
      expect(result.emailText).toMatch(script);
      expect(result.summaryText).toMatch(script);
      expect(result.engine).toBe('openai');
    }
    expect(provider.completeText).toHaveBeenCalledTimes(4);
  });

  it("uses the user's intended response in a local draft and an AI prompt", async () => {
    const response = 'Tell them I cannot attend Friday; ask for Monday instead.';
    const local = await generateReply(emailFor(accountType), { userResponse: response, tone: 'SHORT' });
    expect(local.reply).toContain('I cannot attend Friday; ask for Monday instead.');
    expect(local.fallbackReason).toBe('AI_NOT_CONFIGURED');

    provider.live = true;
    provider.completeJson.mockResolvedValue({
      data: { reply: 'Hi Editor,\n\nI cannot attend Friday. Could we meet Monday instead?\n\nThanks,\n[Your name]' },
      model: 'test-model',
    });
    const online = await generateReply(emailFor(accountType), { userResponse: response, tone: 'SHORT' });
    expect(online.reply).toContain('Could we meet Monday instead?');
    expect(online.engine).toBe('openai');
    expect(provider.completeJson.mock.calls[0][0].user).toContain(response);
  });
});
