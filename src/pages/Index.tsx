import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventSubmissionForm from "@/components/EventSubmissionForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MapPin,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  Heart,
  ArrowUp,
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoFullyLoaded, setVideoFullyLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlayThrough = () => {
      if (video.readyState === 4) {
        setVideoFullyLoaded(true);
        video
          .play()
          .then(() => {})
          .catch((err) => {
            console.warn("Не удалось воспроизвести видео:", err);
            setVideoError(true);
          });
      }
    };

    const handleError = () => {
      setVideoError(true);
    };

    video.addEventListener("canplaythrough", handleCanPlayThrough);
    video.addEventListener("error", handleError);

    video.load();

    return () => {
      video.removeEventListener("canplaythrough", handleCanPlayThrough);
      video.removeEventListener("error", handleError);
    };
  }, []);

  const features = [
    {
      icon: Calendar,
      title: "Актуальные события",
      description: "Всегда свежая информация о культурных мероприятиях Минска",
    },
    {
      icon: MapPin,
      title: "Удобная карта",
      description: "Находите события рядом с вами на интерактивной карте города",
    },
    {
      icon: Users,
      title: "Для всех",
      description: "События для любых возрастов и интересов - от классики до авангарда",
    },
    {
      icon: Sparkles,
      title: "Качественный отбор",
      description: "Только лучшие и проверенные культурные мероприятия",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gray-800"></div>

          {!videoError && (
            <video
              ref={videoRef}
              loop
              muted
              playsInline
              preload="auto"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 blur-sm ${
                videoFullyLoaded ? "opacity-100" : "opacity-0"
              }`}
            >
              <source src="/videos/hero-video.mp4" type="video/mp4" />
              <source src="/videos/hero-video.webm" type="video/webm" />
              Ваш браузер не поддерживает видео.
            </video>
          )}

          <div className="absolute inset-0 bg-amber-400/10 pointer-events-none"></div>

          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto animate-fade-in">
              <h1 className="hero-title mb-6">Культура в кармане</h1>
              <p className="hero-subtitle mb-8">
                Ваш персональный гид по культурной жизни Минска. Откройте для себя
                лучшие театры, музеи, концерты и выставки в одном приложении.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  size="lg"
                  className="btn-cultural text-lg px-8 py-4 
                            group 
                            transition-all duration-300 
                            hover:scale-105 hover:shadow-xl hover:shadow-primary/30 
                            active:scale-95
                            w-full sm:w-auto min-w-[240px]"
                  onClick={() => {
                    navigate("/map");
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }, 100);
                  }}
                >
                  <MapPin
                    className="mr-2 transition-transform duration-300 group-hover:scale-120 group-hover:rotate-12"
                    size={20}
                  />
                  Открыть карту мероприятий
                  <ArrowRight
                    className="ml-2 transition-transform duration-300 group-hover:scale-120 group-hover:translate-x-1"
                    size={20}
                  />
                </Button>
                <Link to="/events/today" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-lg px-8 py-4 
                              group 
                              transition-all duration-300 
                              hover:scale-105 hover:shadow-lg hover:shadow-primary/20 
                              active:scale-95
                              w-full sm:w-auto min-w-[240px]"
                  >
                    <Calendar
                      className="mr-2 transition-transform duration-300 group-hover:scale-120 group-hover:rotate-12"
                      size={20}
                    />
                    Что сегодня?
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute top-10 left-10 w-20 h-20 bg-accent/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
        </section>

        <section className="py-20 bg-subtle-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Почему выбирают нас?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Мы делаем культурную жизнь Минска доступной и удобной
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="event-card text-center animate-fade-in 
                              transition-all duration-300 
                              hover:scale-110 hover:-translate-y-4 hover:shadow-2xl hover:shadow-primary/40 
                              cursor-pointer"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardHeader>
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4">
                        <Icon size={28} className="text-white" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="text-4xl font-bold">70+</div>
                <div className="text-primary-foreground/80">
                  Ежемесячно проводится множество мероприятий
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold">50+</div>
                <div className="text-primary-foreground/80">
                  Большое количество культурных площадок
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold">95%</div>
                <div className="text-primary-foreground/80">
                  Множество пользователей остаются довольны
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="submit-form" className="py-20 bg-subtle-gradient">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                Поделитесь с нами
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Знаете о интересном культурном событии? Помогите другим его найти!
              </p>
            </div>

            <EventSubmissionForm />
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Готовы погрузиться в культурную жизнь Минска?
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8">
                Присоединяйтесь к тысячам людей, которые уже открыли для себя
                удивительный мир культуры нашего города
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/events">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="text-lg px-8 py-4 
                              transition-all duration-300 
                              hover:scale-105 hover:shadow-md 
                              hover:bg-secondary/90 
                              active:scale-95 
                              relative group
                              w-full sm:w-auto min-w-[240px]"
                  >
                    <Heart
                      className="mr-2 transition-transform duration-300 group-hover:scale-120 group-hover:rotate-12"
                      size={20}
                    />
                    Все мероприятия
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-4 
                            border-primary-foreground 
                            !bg-transparent 
                            !text-primary-foreground 
                            hover:!bg-transparent 
                            hover:!text-primary-foreground
                            transition-all duration-300 
                            hover:scale-105 hover:shadow-md 
                            active:scale-95 
                            group
                            w-full sm:w-auto min-w-[240px]"
                  onClick={() => {
                    navigate("/map");
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }, 100);
                  }}
                >
                  <MapPin
                    className="mr-2 transition-transform duration-300 group-hover:scale-120 group-hover:rotate-12"
                    size={20}
                  />
                  Открыть карту
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-5 z-50 p-3 bg-primary text-white rounded-full shadow-lg
                    transition-all duration-300 ease-in-out transform
                    ${showScrollTop 
                      ? 'opacity-100 pointer-events-auto scale-100' 
                      : 'opacity-0 pointer-events-none scale-90'
                    }`}
        aria-label="Вернуться к началу"
      >
        <ArrowUp size={24} />
      </button>

      <Footer />
    </div>
  );
};

export default Index;