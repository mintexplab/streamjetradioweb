import { useState } from 'react';
import { usePosts, useCreatePost, useDeletePost, Post } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Radio, Trash2, Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export function PostFeed() {
  const { user } = useAuth();
  const { currentStation } = useRadioPlayer();
  const { data: posts, isLoading } = usePosts();
  const createPost = useCreatePost();
  const deletePost = useDeletePost();
  const [newPost, setNewPost] = useState('');
  const [attachStation, setAttachStation] = useState(false);

  const handleSubmit = async () => {
    if (!newPost.trim() || newPost.length > 1000) return;

    await createPost.mutateAsync({
      content: newPost,
      stationUuid: attachStation && currentStation ? currentStation.stationuuid : undefined,
      stationName: attachStation && currentStation ? currentStation.name : undefined,
    });

    setNewPost('');
    setAttachStation(false);
  };

  const handleDelete = async (postId: string) => {
    await deletePost.mutateAsync(postId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create post */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="What's on your mind?"
                className="resize-none"
                rows={3}
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentStation && (
                    <Button
                      variant={attachStation ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAttachStation(!attachStation)}
                    >
                      <Radio className="w-4 h-4 mr-2" />
                      {attachStation ? currentStation.name : 'Attach station'}
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {newPost.length}/1000
                  </span>
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!newPost.trim() || createPost.isPending}
                  size="sm"
                >
                  {createPost.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts list */}
      {posts?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
          </CardContent>
        </Card>
      ) : (
        posts?.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onDelete={handleDelete}
            isOwn={post.user_id === user?.id}
          />
        ))
      )}
    </div>
  );
}

function PostCard({ 
  post, 
  onDelete, 
  isOwn 
}: { 
  post: Post; 
  onDelete: (id: string) => void;
  isOwn: boolean;
}) {
  const profile = post.profile;
  const displayName = profile?.display_name || profile?.username || 'Anonymous';
  const username = profile?.username;

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Link to={username ? `/profile/@${username}` : '#'}>
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link 
                to={username ? `/profile/@${username}` : '#'}
                className="font-semibold hover:underline"
              >
                {displayName}
              </Link>
              {username && (
                <span className="text-muted-foreground text-sm">@{username}</span>
              )}
              <span className="text-muted-foreground text-sm">
                · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>

            <p className="mt-2 whitespace-pre-wrap break-words">{post.content}</p>

            {post.station_name && (
              <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                <Radio className="w-4 h-4" />
                <span>Listening to {post.station_name}</span>
              </div>
            )}

            {isOwn && (
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(post.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
