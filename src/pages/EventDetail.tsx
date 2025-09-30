import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Clock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { YMaps, Map as YMap, Placemark, ZoomControl } from "@pbe/react-yandex-maps";

const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const firstDate = dateStr.split(',')[0].trim();
  const parts = firstDate.split(' ');
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  const monthMap = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04', 'мая': '05', 'июня': '06',
    'июля': '07', 'августа': '08', 'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
  };
  const month = monthMap[monthStr] || '01';
  const year = new Date().getFullYear();
  return `${year}-${month}-${day.toString().padStart(2, '0')}`;
};

const capitalizeFirstLetter = (str: string) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
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
        
        const rawEvents = rows.map((row: string[], index: number) => {
          const eventObj: any = { id: index + 1 };
          headers.forEach((header: string, index: number) => {
            eventObj[header] = row[index] || '';
          });
          return eventObj;
        });
        
        const mappedEvents = rawEvents.map((event: any, index: number) => ({
          id: index + 1,
          title: event['Название'] || '',
          description: event['Краткое описание'] || '',
          date: parseDate(event['Дата'] || ''),
          time: event['Время'] || '',
          location: event['Место'] || '',
          address: event['Адрес'] || '',
          category: event['Жанр'] || '',
          cost: event['Стоимость'] || '',
          image: event['Фото'] || '',
          link: event['Ссылка'] || '',
          coordinates: event['Координаты'] || ''
        })).filter((event: any) => event.title);
        
        const selectedEvent = mappedEvents.find((e: any) => e.id === parseInt(id || '0'));
        setEvent(selectedEvent);
      } catch (err: any) {
        console.error('Error fetching from Google Sheets:', err);
        setError(`Error fetching data: ${err.message}. Make sure the sheet is publicly accessible.`);
      }
    };

    fetchEvent();
  }, [id]);

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Мероприятие не найдено"}</h1>
          <Link to="/events">
            <Button
              className="btn-cultural 
                        group 
                        transition-all duration-300 
                        hover:scale-105 hover:shadow-xl hover:shadow-primary/30 
                        active:scale-95"
            >
              Вернуться к списку мероприятий
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Ссылка скопирована",
        description: "Ссылка на мероприятие скопирована в буфер обмена",
      });
    }
  };

  const isFree = event.cost && event.cost.toLowerCase().includes('бесплатно');
  const buttonText = event.link
    ? isFree
      ? 'Посетить сайт'
      : 'Купить билет'
    : 'О мероприятии';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/events" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Назад к мероприятиям
          </Link>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">{event.title}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div 
              className="aspect-video rounded-xl overflow-hidden"
              style={{ 
                backgroundImage: `url(${event.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: event.image ? 'transparent' : 'bg-gradient-to-br from-primary/30 to-accent/30'
              }}
            ></div>
            
            <Card className="event-card">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">О мероприятии</h2>
                <div className="prose prose-gray max-w-none">
                  {event.description.split('\n').map((paragraph: string, index: number) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {(() => {
              const [lat, lng] = (event.coordinates || '')
                .split(',')
                .map((coord: string) => parseFloat(coord.trim()));
              const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
              return hasCoords ? (
                <Card className="event-card">
                  <CardContent className="pt-6">
                    <h2 className="text-xl font-semibold mb-4">Где пройдет мероприятие</h2>
                    <div className="h-[360px] rounded-lg overflow-hidden">
                      <YMaps>
                        <YMap
                          defaultState={{ center: [lat, lng], zoom: 14 }}
                          width="100%"
                          height="100%"
                          options={{ suppressMapOpenBlock: true }}
                        >
                          <ZoomControl options={{ position: { right: 16, top: 16 } }} />
                          <Placemark
                            geometry={[lat, lng]}
                            properties={{ 
                              hintContent: event.title, 
                              balloonContentHeader: event.title, 
                              balloonContentBody: `${event.location}<br/>${event.address}` 
                            }}
                            modules={["geoObject.addon.hint", "geoObject.addon.balloon"]}
                          />
                        </YMap>
                      </YMaps>
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}
          </div>
          
          <div className="space-y-6">
            <Card className="event-card">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-lg mb-4">Детали мероприятия</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Calendar className="text-primary mt-1 mr-3" size={18} />
                    <div>
                      <div className="font-medium">{formatDate(event.date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="text-primary mt-1 mr-3" size={18} />
                    <div>
                      <div className="font-medium">{event.time}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="text-primary mt-1 mr-3" size={18} />
                    <div>
                      <div className="font-medium">{event.location}</div>
                      <div className="text-sm text-muted-foreground">{event.address}</div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-lg font-semibold text-primary mb-2">
                    Стоимость: {event.cost || 'Не указано'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {event.link && (
                    <a href={event.link} target="_blank" rel="noopener noreferrer" className="block w-full">
                      <Button
                        className="w-full 
                                  btn-cultural
                                  group
                                  bg-white 
                                  transition-all duration-300 
                                  hover:scale-105 hover:shadow-lg hover:shadow-primary/20 
                                  active:scale-95
                                  will-change-transform 
                                  backface-visibility-hidden
                                  border-none"
                      >
                        {buttonText}
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EventDetail;