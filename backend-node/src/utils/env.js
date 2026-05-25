const DEFAULT_DB_NAME = 'eventsphere';

const stripMarkdownMailto = (value) => value.replace(/\[([^\]]+)\]\(mailto:[^)]+\)/g, '$1');

const ensureMongoDatabaseName = (value) => {
  const queryIndex = value.indexOf('?');
  const beforeQuery = queryIndex === -1 ? value : value.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : value.slice(queryIndex);

  if (/mongodb(?:\+srv)?:\/\/[^/]+\/[^?]+/.test(value)) {
    return value;
  }

  return `${beforeQuery.replace(/\/$/, '')}/${DEFAULT_DB_NAME}${query}`;
};

const ensureMongoTimeouts = (value) => {
  try {
    const parsed = new URL(value);
    if (!parsed.searchParams.has('serverSelectionTimeoutMS')) {
      parsed.searchParams.set('serverSelectionTimeoutMS', '8000');
    }
    if (!parsed.searchParams.has('connectTimeoutMS')) {
      parsed.searchParams.set('connectTimeoutMS', '8000');
    }
    return parsed.toString();
  } catch {
    return value;
  }
};

const normalizeMongoDatabaseUrl = (rawValue) => {
  if (!rawValue || !rawValue.startsWith('mongodb')) return rawValue;

  let value = stripMarkdownMailto(rawValue.trim());

  try {
    const parsed = new URL(value);
    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = `/${DEFAULT_DB_NAME}`;
    }
    return ensureMongoTimeouts(parsed.toString());
  } catch {
    const protocolMatch = value.match(/^(mongodb(?:\+srv)?:\/\/)/);
    if (!protocolMatch) return value;

    const protocol = protocolMatch[1];
    const rest = value.slice(protocol.length);
    const queryIndex = rest.indexOf('?');
    const authAndHost = queryIndex === -1 ? rest : rest.slice(0, queryIndex);
    const query = queryIndex === -1 ? '' : rest.slice(queryIndex);
    const atIndex = authAndHost.lastIndexOf('@');

    if (atIndex === -1) return ensureMongoTimeouts(ensureMongoDatabaseName(value));

    const auth = authAndHost.slice(0, atIndex);
    const hostAndPath = authAndHost.slice(atIndex + 1);
    const colonIndex = auth.indexOf(':');

    if (colonIndex === -1) return ensureMongoTimeouts(ensureMongoDatabaseName(value));

    const username = encodeURIComponent(decodeURIComponent(auth.slice(0, colonIndex)));
    const password = encodeURIComponent(decodeURIComponent(auth.slice(colonIndex + 1)));
    return ensureMongoTimeouts(ensureMongoDatabaseName(`${protocol}${username}:${password}@${hostAndPath}${query}`));
  }
};

const normalizeEnvironment = () => {
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = normalizeMongoDatabaseUrl(process.env.DATABASE_URL);
  }
};

module.exports = {
  normalizeEnvironment,
  normalizeMongoDatabaseUrl,
};
