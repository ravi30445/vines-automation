
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Star, Clock, Globe, Play, MessageCircle, Shield, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceAgent {
  id: string;
  name: string;
  title: string;
  description: string;
  category: string;
  price: number;
  delivery_time: number;
  languages: string[];
  specialties: string[];
  rating: number;
  review_count: number;
  is_online: boolean;
  avatar_url?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_id: string;
  profiles: {
    full_name: string;
  };
}

const AgentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [agent, setAgent] = useState<VoiceAgent | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [isTrying, setIsTrying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAgentDetails();
      fetchReviews();
    }
  }, [id]);

  const fetchAgentDetails = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('voice_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAgent(data);
    } catch (error) {
      console.error('Error fetching agent:', error);
      navigate('/agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('reviews')
        .select(`
          *,
          profiles:reviewer_id (full_name)
        `)
        .eq('agent_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleTryMe = () => {
    setIsTrying(true);
    // Simulate a demo call
    setTimeout(() => {
      setIsTrying(false);
      toast({
        title: "Demo completed!",
        description: "You've experienced a sample of this voice agent. Ready to purchase?",
      });
    }, 3000);
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!agent) return;

    setOrdering(true);
    try {
      const { error } = await (supabase as any)
        .from('orders')
        .insert({
          buyer_id: user.id,
          agent_id: agent.id,
          amount: agent.price,
          requirements: requirements || null,
        });

      if (error) throw error;

      toast({
        title: "Purchase successful!",
        description: "Your voice agent is now ready to use. Check your dashboard for setup instructions.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error processing purchase",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setOrdering(false);
    }
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Loading agent details...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Agent not found</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {agent.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-white text-2xl">{agent.name}</CardTitle>
                      {agent.is_online && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-green-400 text-sm">Available</span>
                        </div>
                      )}
                    </div>
                    <CardDescription className="text-slate-300 text-lg">
                      {agent.title}
                    </CardDescription>
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300 mt-2">
                      {formatCategory(agent.category)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-white font-semibold mb-2">About This Voice Agent</h3>
                  <p className="text-slate-300">{agent.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <div>
                      <div className="text-white font-semibold">{agent.rating}/5</div>
                      <div className="text-slate-400 text-sm">{agent.review_count} reviews</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <div>
                      <div className="text-white font-semibold">Instant</div>
                      <div className="text-slate-400 text-sm">Setup time</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-white font-semibold">Reliable</div>
                      <div className="text-slate-400 text-sm">24/7 Service</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-3">Supported Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.languages.map((lang, index) => (
                      <Badge key={index} variant="outline" className="border-slate-600 text-slate-300">
                        <Globe className="w-3 h-3 mr-1" />
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-3">Key Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {agent.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline" className="border-slate-600 text-slate-300">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Try Me Section */}
                <div className="bg-slate-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Try Before You Buy</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Experience a sample conversation with this voice agent to see how it works.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-600"
                    onClick={handleTryMe}
                    disabled={isTrying}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {isTrying ? 'Demo in Progress...' : 'Try Me - Free Demo'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Customer Reviews ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-slate-700 pb-4 last:border-b-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-slate-300 font-medium">
                        {review.profiles?.full_name || 'Anonymous Customer'}
                      </span>
                      <span className="text-slate-500 text-sm">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-slate-300 text-sm">{review.comment}</p>
                    )}
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-slate-400">No reviews yet - be the first to try this agent!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Purchase Section */}
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700 sticky top-4">
              <CardHeader>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white mb-2">${agent.price}</div>
                  <p className="text-slate-400">One-time purchase</p>
                  <p className="text-slate-500 text-sm">Lifetime access</p>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="requirements" className="text-white">
                    Special Requirements (Optional)
                  </Label>
                  <Textarea
                    id="requirements"
                    placeholder="Any specific customizations or requirements for your use case..."
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white mt-2"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-3"
                    onClick={handlePurchase}
                    disabled={ordering}
                  >
                    {ordering ? 'Processing...' : 'Buy Now to Use'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </div>

                <div className="text-center text-slate-400 text-sm space-y-1">
                  <p>✅ Instant activation</p>
                  <p>🔒 Secure payment</p>
                  <p>💬 24/7 support included</p>
                  <p>🔄 30-day money-back guarantee</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AgentDetail;
