import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { YMaps, Map as YMap, Placemark, ZoomControl, GeolocationControl } from "@pbe/react-yandex-maps";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import EventSubmissionForm from "@/components/EventSubmissionForm";

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

const Map = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false); 

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
        
        const rawEvents = rows.map((row: string[], index: number) => {
          const eventObj: any = { id: index + 1 };
          headers.forEach((header: string, index: number) => {
            eventObj[header] = row[index] || '';
          });
          return eventObj;
        });
        
        const mappedEvents = rawEvents.map((event: any, index: number) => {
          const [lat, lng] = event['Координаты'] ? event['Координаты'].split(',').map((coord: string) => parseFloat(coord.trim())) : [0, 0];
          return {
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
            coordinates: { lat, lng }
          };
        }).filter((event: any) => event.title && event.coordinates.lat && event.coordinates.lng);
        
        setEvents(mappedEvents);
      } catch (err: any) {
        console.error('Error fetching from Google Sheets:', err);
        setError(`Error fetching data: ${err.message}. Make sure the sheet is publicly accessible.`);
      }
    };

    fetchEvents();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const filteredEvents = events.filter((event) => event.date === selectedDate);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Карта мероприятий Минска
          </h1>
          <p className="text-muted-foreground text-lg">
            Найдите интересные события рядом с вами
          </p>
        </div>

        {error ? (
          <div className="text-center py-12 max-w-md mx-auto">
            <MapPin size={64} className="mx-auto text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-4">{error}</h3>
            <Link to="/events">
              <Button className="btn-cultural">
                Все мероприятия
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-[600px] relative overflow-hidden">
                <div className="absolute inset-0">
                  <YMaps>
                    <YMap
                      defaultState={{ center: [53.9023, 27.5619], zoom: 12 }}
                      width="100%"
                      height="100%"
                      options={{
                        suppressMapOpenBlock: true,
                      }}
                    >
                      <ZoomControl options={{ position: { right: 16, top: 16 } }} />
                      <GeolocationControl options={{ position: { right: 16, top: 64 } }} />
                      {filteredEvents.map((event) => (
                        <Placemark
                          key={event.id}
                          geometry={[event.coordinates.lat, event.coordinates.lng]}
                          properties={{
                            balloonContentHeader: event.title,
                            balloonContentBody: `<div>${event.location}<br/>${event.address}</div>`,
                            hintContent: event.title,
                          }}
                          options={{
                            preset: selectedEvent?.id === event.id ? 'islands#redIcon' : 'islands#blueIcon',
                            openBalloonOnClick: false,
                          }}
                          modules={["geoObject.addon.hint", "geoObject.addon.balloon"]}
                          onClick={() => setSelectedEvent(event)}
                        />
                      ))}
                    </YMap>
                  </YMaps>
                </div>
                <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg space-y-3">
                  <div className="text-sm font-medium">Легенда и фильтр</div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 bg-primary rounded-full"></div>
                    <span>Мероприятие</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(todayStr)}
                    >
                      Сегодня
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Мероприятия на карте</h2>
              
              {filteredEvents.map((event, index) => (
                <Card 
                  key={event.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedEvent?.id === event.id ? 'ring-2 ring-primary shadow-lg' : ''
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {capitalizeFirstLetter(event.category)}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {event.location}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar size={14} className="mr-2" />
                      {formatDate(event.date)}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock size={14} className="mr-2" />
                      {event.time}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {event.address}
                    </div>
                    <Link to={`/event/${event.id}`} className="block w-full">
                      <Button
                        className="w-full btn-outline-cultural 
                                  group 
                                  transition-all duration-300 
                                  hover:scale-105 hover:shadow-lg hover:shadow-primary/20 
                                  active:scale-95 mt-2"
                      >
                        Подробнее
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}

              {filteredEvents.length === 0 && (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    На выбранную дату событий нет.
                  </CardContent>
                </Card>
              )}
              
              <Card className="border-dashed border-2 border-muted-foreground/30">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <MapPin size={32} className="text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">
                    Не видите свое мероприятие на карте?
                  </p>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 active:scale-95 will-change-transform backface-visibility-hidden"
                      >
                        Предложить мероприятие
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 md:p-8">
                      <EventSubmissionForm />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Map;