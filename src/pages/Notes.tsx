import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, StickyNote, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [search, setSearch] = useState('');

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) {
      setNotes(data.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = async () => {
    if (!user || !title.trim()) return;
    const { data } = await supabase.from('notes').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
    }).select().single();
    if (data) {
      setNotes(prev => [{
        id: data.id, title: data.title, content: data.content,
        createdAt: data.created_at, updatedAt: data.updated_at,
      }, ...prev]);
      setTitle(''); setContent(''); setAdding(false);
      toast.success('Note added');
    }
  };

  const updateNote = async (id: string) => {
    await supabase.from('notes').update({
      title: editTitle.trim(),
      content: editContent.trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setNotes(prev => prev.map(n => n.id === id
      ? { ...n, title: editTitle.trim(), content: editContent.trim(), updatedAt: new Date().toISOString() }
      : n
    ));
    setEditingId(null);
    toast.success('Note updated');
  };

  const deleteNote = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
    toast.success('Note deleted');
  };

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-primary" />
          Notes
        </h1>
        <Button size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </div>

      {adding && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Title (e.g. Usage log, Observation...)"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="Write your note here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setTitle(''); setContent(''); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={addNote} disabled={!title.trim()}>
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {notes.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {notes.length === 0 ? 'No notes yet. Tap "New" to start logging.' : 'No matching notes.'}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map(note => (
            <Card key={note.id} className="overflow-hidden">
              <CardContent className="p-0">
                <button
                  className="w-full flex items-center justify-between p-3 text-left"
                  onClick={() => {
                    setExpandedId(expandedId === note.id ? null : note.id);
                    if (editingId === note.id) setEditingId(null);
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(note.updatedAt), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                  {expandedId === note.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {expandedId === note.id && (
                  <div className="px-3 pb-3 border-t border-border pt-2 space-y-2">
                    {editingId === note.id ? (
                      <>
                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                        <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={4} />
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => updateNote(note.id)}>Save</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap text-foreground">
                          {note.content || <span className="text-muted-foreground italic">No content</span>}
                        </p>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingId(note.id);
                            setEditTitle(note.title);
                            setEditContent(note.content);
                          }}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteNote(note.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
