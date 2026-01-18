import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getProject, updateProject, getProjectMembership } from '@/lib/api';
import { CheckCircle2, Save, ExternalLink } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Props {
    projectId: string;
    role?: string; // Optional now
}

export function SubmissionTab({ projectId, role: initialRole }: Props) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [role, setRole] = useState(initialRole || 'VIEWER');
    const [formData, setFormData] = useState({
        submissionGithub: '',
        submissionDemo: '',
        submissionPPT: '',
        submissionVideo: '',
        submissionDescription: ''
    });

    useEffect(() => {
        if (session?.user && projectId) {
            // @ts-ignore
            getProjectMembership(projectId, session.user.id).then(m => {
                if (m) setRole(m.role);
            });
        }
    }, [session, projectId]);

    const isViewer = role === 'VIEWER';

    useEffect(() => {
        loadProjectDetails();
    }, [projectId]);

    async function loadProjectDetails() {
        setLoading(true);
        try {
            const project = await getProject(projectId);
            setFormData({
                submissionGithub: project.submissionGithub || '',
                submissionDemo: project.submissionDemo || '',
                submissionPPT: project.submissionPPT || '',
                submissionVideo: project.submissionVideo || '',
                submissionDescription: project.submissionDescription || ''
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!session?.user || isViewer) return;
        setSaving(true);
        try {
            await updateProject(projectId, formData, (session.user as any).id);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    }

    const completedFields = Object.values(formData).filter(Boolean).length;
    const totalFields = 5;
    const progress = Math.round((completedFields / totalFields) * 100);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Submission Checklist</CardTitle>
                            <CardDescription>Ensure all submission requirements are met before the hackathon ends.</CardDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{progress}%</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                        <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center">
                                GitHub Repository
                                {formData.submissionGithub && <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />}
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://github.com/..."
                                    value={formData.submissionGithub}
                                    onChange={e => setFormData({ ...formData, submissionGithub: e.target.value })}
                                    disabled={isViewer}
                                />
                                {formData.submissionGithub && (
                                    <Button variant="outline" size="icon" asChild>
                                        <a href={formData.submissionGithub} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center">
                                Live Demo Link
                                {formData.submissionDemo && <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />}
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://demo.vercel.app"
                                    value={formData.submissionDemo}
                                    onChange={e => setFormData({ ...formData, submissionDemo: e.target.value })}
                                    disabled={isViewer}
                                />
                                {formData.submissionDemo && (
                                    <Button variant="outline" size="icon" asChild>
                                        <a href={formData.submissionDemo} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center">
                                Presentation (PPT/Deck)
                                {formData.submissionPPT && <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />}
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://slides.com/..."
                                    value={formData.submissionPPT}
                                    onChange={e => setFormData({ ...formData, submissionPPT: e.target.value })}
                                    disabled={isViewer}
                                />
                                {formData.submissionPPT && (
                                    <Button variant="outline" size="icon" asChild>
                                        <a href={formData.submissionPPT} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center">
                                Demo Video
                                {formData.submissionVideo && <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />}
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://youtube.com/..."
                                    value={formData.submissionVideo}
                                    onChange={e => setFormData({ ...formData, submissionVideo: e.target.value })}
                                    disabled={isViewer}
                                />
                                {formData.submissionVideo && (
                                    <Button variant="outline" size="icon" asChild>
                                        <a href={formData.submissionVideo} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center">
                            Submission Description / Abstract
                            {formData.submissionDescription && <CheckCircle2 className="w-4 h-4 text-green-500 ml-2" />}
                        </label>
                        <Textarea
                            placeholder="Briefly describe your project, the problem it solves, and the tech stack used..."
                            className="h-32"
                            value={formData.submissionDescription}
                            onChange={e => setFormData({ ...formData, submissionDescription: e.target.value })}
                            disabled={isViewer}
                        />
                    </div>

                    {!isViewer && (
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSave} disabled={saving}>
                                <Save className="w-4 h-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Checklist'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
