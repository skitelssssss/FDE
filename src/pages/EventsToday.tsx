import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Heart, ArrowUp } from "lucide-react";

const parseDate = (dateStr) => {
  if (!dateStr) return [];
  const dates = dateStr.split(',').map(date => {
    const parts = date.trim().split(' ');
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const monthMap = {
      'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04', 'мая': '05', 'июня': '06',
      'июля': '07', 'августа': '08', 'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
    };
    const month = monthMap[monthStr] || '01';
    const year = new Date().getFullYear();
    return `${year}-${month}-${day.toString().padStart(2, '0')}`;
  });
  return dates;
};

const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const EventsToday = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const today = new Date().toLocaleDateString('ru-RU', { 
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const spreadsheetId = '1U1qBrsnQsv2wn0EkGU7GPMZX88wcHKnc2hvHkdykUZk';
        const apiKey = 'AIzaSyBScuwFWwr9fhUpAnKytPYfiAlf8bw2voQ';
        const range = 'A1:K';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        if (!data.values || data.values.length < 2) {
          throw new Error('No data found in the sheet');
        }
        
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        const rawEvents = rows.map((row, index) => {
          const eventObj = { id: index + 1 };
          headers.forEach((header, index) => {
            eventObj[header] = row[index] || '';
          });
          return eventObj;
        });
        
        const mappedEvents = rawEvents.map((event, index) => ({
          id: index + 1,
          title: event['Название'] || '',
          description: event['Краткое описание'] || '',
          dates: parseDate(event['Дата'] || ''),
          time: event['Время'] || '',
          location: event['Место'] || '',
          category: event['Жанр'] || '',
          address: event['Адрес'] || '',
          cost: event['Стоимость'] || '',
          image: event['Фото'] || '',
          link: event['Ссылка'] || '',
          coordinates: event['Координаты'] || ''
        })).filter((event) => event.title && event.dates.includes(todayStr));
        
        setEvents(mappedEvents);
      } catch (err) {
        console.error('Error fetching from Google Sheets:', err);
        setError(`Error fetching data: ${err.message}. Make sure the sheet is publicly accessible.`);
      }
    };

    fetchEvents();
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              Мероприятия сегодня
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mb-2">
            {today}
          </p>
          <p className="text-muted-foreground">
            Что происходит в культурной жизни Минска прямо сейчас
          </p>
        </div>

        {error ? (
          <div className="text-center py-12 max-w-md mx-auto">
            <Calendar size={64} className="mx-auto text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-4">{error}</h3>
            <Link to="/events">
            <Button
              size="lg"
              className="btn-cultural text-lg px-8 py-4 
                        group 
                        transition-all duration-300 
                        hover:scale-105 hover:shadow-xl hover:shadow-primary/30 
                        active:scale-95
                        w-full sm:w-auto min-w-[240px]"
            >
              <Heart
                className="mr-2 transition-transform duration-300 group-hover:scale-120 group-hover:rotate-12"
                size={20}
              />
              Все мероприятия
            </Button>
          </Link>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {events.map((event, index) => (
              <Card 
                key={event.id} 
                className="event-card animate-fade-in bg-gradient-to-br from-card to-card/50
                           transition-all duration-300 
                           hover:scale-110 hover:-translate-y-4 hover:shadow-2xl hover:shadow-primary/40 
                           cursor-pointer"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div 
                  className="aspect-video rounded-t-xl"
                  style={{ 
                    backgroundImage: `url(${event.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: event.image ? 'transparent' : 'bg-gradient-to-br from-primary/30 to-accent/30'
                  }}
                ></div>
                
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {capitalizeFirstLetter(event.category)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold line-clamp-2">
                    {event.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center text-primary font-medium">
                    <Clock size={18} className="mr-2" />
                    Сегодня в {event.time}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin size={16} className="mr-2" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link to={`/event/${event.id}`} className="flex-1">
                      <Button
                        className="w-full btn-outline-cultural 
                                  group 
                                  transition-all duration-300 
                                  hover:scale-105 hover:shadow-lg hover:shadow-primary/20 
                                  active:scale-95"
                      >
                        Подробнее
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="flex-1 
                                group 
                                transition-all duration-300 
                                hover:scale-105 hover:shadow-lg hover:shadow-primary/20 
                                active:scale-95
                                will-change-transform 
                                backface-visibility-hidden
                                border-none"
                    >
                      Маршрут
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 max-w-md mx-auto">
            <Calendar size={64} className="mx-auto text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-4">Сегодня нет мероприятий</h3>
            <p className="text-muted-foreground mb-6">
              Но не расстраивайтесь! Посмотрите, что интересного планируется на ближайшие дни.
            </p>
            <Link to="/events">
              <Button
                size="lg"
                className="btn-cultural text-lg px-8 py-4 
                          group 
                          transition-all duration-300 
                          hover:scale-105 hover:shadow-xl hover:shadow-primary/30 
                          active:scale-95
                          w-full sm:w-auto min-w-[240px]"
              >
                <Heart
                  className="mr-2 transition-transform duration-300 group-hover:scale-120 group-hover:rotate-12"
                  size={20}
                />
                Все мероприятия
              </Button>
            </Link>
          </div>
        )}

        {events.length > 0 && (
          <div className="text-center mt-12">
            <Link to="/events">
              <Button variant="outline" size="lg"
                className="flex-1 
                          group
                          bg-white 
                          transition-all duration-300 
                          hover:scale-105 hover:shadow-lg hover:shadow-primary/20 
                          active:scale-95
                          will-change-transform 
                          backface-visibility-hidden"
              >
                Посмотреть все мероприятия
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Кнопка "вверх" с плавной анимацией */}
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

export default EventsToday;