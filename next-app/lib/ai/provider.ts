export const getModelId = (): string => {
  return process.env.AI_CHAT_MODEL ?? 'anthropic/claude-sonnet-4.5';
};

const loadOpenRouterFactory = async (): Promise<
  (config: Record<string, unknown>) => {
    chat: (modelId: string) => unknown;
  }
> => {
  try {
    const safeRequire = eval('require') as NodeJS.Require;
    const mod = safeRequire('@openrouter/ai-sdk-provider') as {
      createOpenRouter?: (config: Record<string, unknown>) => {
        chat: (modelId: string) => unknown;
      };
    };

    if (typeof mod.createOpenRouter !== 'function') {
      throw new Error('createOpenRouter export not found');
    }

    return mod.createOpenRouter;
  } catch (error) {
    throw new Error(
      `OPENROUTER_API_KEY is set, but OpenRouter provider is unavailable. Install @openrouter/ai-sdk-provider. (${error})`,
    );
  }
};

export const resolveChatModel = async (): Promise<any> => {
  const modelId = getModelId();

  if (process.env.OPENROUTER_API_KEY) {
    const createOpenRouter = await loadOpenRouterFactory();
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
      ...(process.env.OPENROUTER_HTTP_REFERER
        ? { httpReferer: process.env.OPENROUTER_HTTP_REFERER }
        : {}),
      ...(process.env.OPENROUTER_APP_NAME
        ? { xTitle: process.env.OPENROUTER_APP_NAME }
        : {}),
    });

    const model = openrouter.chat(modelId) as {
      specificationVersion?: string;
    };

    if (model?.specificationVersion !== 'v2') {
      throw new Error(
        `OpenRouter provider returned unsupported model spec version "${model?.specificationVersion ?? 'unknown'}". This app currently runs on AI SDK v5 (spec v2). Configure AI_GATEWAY_API_KEY or migrate SDK stack to v6.`,
      );
    }

    return model as any;
  }

  if (process.env.AI_GATEWAY_API_KEY) {
    return modelId as any;
  }

  throw new Error(
    'No model provider configured. Set OPENROUTER_API_KEY or AI_GATEWAY_API_KEY.',
  );
};
