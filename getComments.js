const API_KEY = 'REPLACE THIS'; // YouTube API key

async function fetchTopComments(videoId, min = 17) {
  const allComments = [];
  let nextPageToken = '';
  const maxPages = 5;
  let pagesFetched = 0;

  try {
    do {
      const endpoint = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&key=${API_KEY}&maxResults=100&order=time&pageToken=${nextPageToken}`;
      const res = await fetch(endpoint);
      const data = await res.json();

      if (!data.items) break;

      const batch = data.items.map(item => {
        const snippet = item.snippet.topLevelComment.snippet;
        return {
          username: snippet.authorDisplayName || '@Anonymous',
          comment: snippet.textDisplay || '',
          avatar: snippet.authorProfileImageUrl || 'https://i.imgur.com/WaUgaKz.png',
		  topic: snippet.authorDisplayName || 'USER',
          timestamp: snippet.publishedAt || ''
        };
      });

      allComments.push(...batch);
      nextPageToken = data.nextPageToken || '';
      pagesFetched++;

    } while (nextPageToken && pagesFetched < maxPages);

    const useful = allComments
      .filter(c => isUsefulComment(c.comment))
      .sort((a, b) => scoreComment(b.comment) - scoreComment(a.comment));

    if (useful.length >= min) {
      return useful.slice(0, min);
    } else {
      const fallback = allComments
        .filter(c => !useful.includes(c))
        .slice(0, min - useful.length);
      return useful.concat(fallback);
    }

  } catch (err) {
    console.error('Failed to fetch comments:', err);
    return [];
  }
}

function isUsefulComment(comment) {
  const text = comment.toLowerCase().trim();
  if (text.replace(/\s/g, '').length === 0) return false;

  const questionFlags = [
    'i don’t understand', 'can someone explain', 'what does',
    'does this mean', 'why did', 'how come', 'confused',
    'help me understand', 'what if', 'how is', 'should we',
    'anyone know', 'what happened', 'how does', 'is it true'
  ];

  return questionFlags.some(flag => text.includes(flag)) || text.includes('?');
}

function scoreComment(comment) {
  const text = comment.toLowerCase();
  const keywords = [
    'explain', 'why', 'how', 'what', '?',
    'don’t understand', 'confused', 'anyone know',
    'does this mean', 'help me', 'what happened'
  ];

  return keywords.reduce((score, keyword) => {
    return score + (text.includes(keyword) ? 1 : 0);
  }, 0);
}
