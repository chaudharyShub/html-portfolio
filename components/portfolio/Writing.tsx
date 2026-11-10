import Image from 'next/image';
import { TabGlyph } from '@/components/icons';
import { PROFILE } from '@/data/profile';
import { BLOG_URL, type BlogPost } from '@/lib/blog';

/** The latest blog posts as a list of rows with a small cover (Hashnode, plus the dev.to copy). */
export function Writing({ posts }: { posts: BlogPost[] }) {
  return (
    <fieldset className="section" id="section-writing">
      <legend>
        <h2>Writing</h2>
      </legend>
      {posts.length === 0 ? (
        <p>
          I write about frontend, backend, cloud and security. Read the posts on{' '}
          <a href={BLOG_URL} target="_blank" rel="noopener noreferrer">Hashnode</a> or{' '}
          <a href={PROFILE.links.devto.href} target="_blank" rel="noopener noreferrer">dev.to</a>.
        </p>
      ) : (
        <>
          <div className="post-list">
            {posts.map((post) => (
              <PostRow post={post} key={post.url} />
            ))}
          </div>
          <a className="post-all" href={BLOG_URL} target="_blank" rel="noopener noreferrer">
            All posts on the blog &#8599;
          </a>
        </>
      )}
    </fieldset>
  );
}

/** The title link covers the whole row (::after); the dev.to link sits above it. */
function PostRow({ post }: { post: BlogPost }) {
  return (
    <article className="post-row">
      <div className="post-thumb">
        {post.cover ? (
          // Decorative: the title beside it says what the post is.
          <Image src={post.cover} alt="" fill sizes="120px" />
        ) : (
          <span className="post-thumb-empty">
            <TabGlyph name="writing" />
          </span>
        )}
      </div>
      <div className="post-text">
        <h3 className="post-title">
          <a href={post.url} target="_blank" rel="noopener noreferrer" aria-label={`${post.title} (on Hashnode, opens in a new tab)`}>
            {post.title}
          </a>
        </h3>
        <div className="post-meta">
          <span className="post-when">
            <time dateTime={post.published}>{post.dateLabel}</time> · {post.readMinutes} min read
          </span>
          {post.devtoUrl && (
            <span className="post-devto-wrap">
              <span className="post-sep"> · </span>
              <a
                className="post-devto"
                href={post.devtoUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read "${post.title}" on dev.to (opens in a new tab)`}
              >
                dev.to &#8599;
              </a>
            </span>
          )}
        </div>
        {post.summary && <p className="post-summary">{post.summary}</p>}
      </div>
    </article>
  );
}
