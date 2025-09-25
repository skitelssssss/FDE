import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Clock, Search } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay,
  startOfDay,
  isBefore
} from "date-fns";
import ru from "date-fns/locale/ru";

const parseDate = (dateStr) => {
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

const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const eventsListRef = useRef(null);

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
        
        const rawEvents = rows.map(row => {
          const eventObj = {};
          headers.forEach((header, index) => {
            eventObj[header] = row[index] || '';
          });
          return eventObj;
        });
        
        const mappedEvents = rawEvents.map((event, index) => ({
          id: index + 1,
          title: event['Название'] || '',
          description: event['Краткое описание'] || '',
          date: parseDate(event['Дата'] || ''),
          time: event['Время'] || '',
          location: event['Место'] || '',
          category: event['Жанр'] || '',
          image: event['Фото'] || '',
          address: event['Адрес'] || '',
          coordinates: event['Координаты'] || '',
          cost: event['Стоимость'] || '',
          link: event['Ссылка'] || ''
        })).filter(event => event.title);
        
        setEvents(mappedEvents);
      } catch (err) {
        console.error('Error fetching from Google Sheets:', err);
        setError(`Error fetching data from Google Sheets: ${err.message}. Make sure the sheet is publicly accessible (share with "Anyone with the link can view").`);
      }
    };

    fetchEvents();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const uniqueDates = Array.from(
    new Set(events.map(event => event.date))
  ).sort();

  const filteredEvents = events
    .filter(event => (event.title || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(event => (selectedDate ? event.date === selectedDate : true))
    .filter(event => event.date >= todayStr);

  const sortedEvents = [...filteredEvents].sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  const totalPages = Math.ceil(sortedEvents.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = sortedEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate]);

  const formatDotDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const isDateAvailable = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return uniqueDates.includes(dateString);
  };

  const isFutureOrToday = (date) => {
    return !isBefore(date, new Date());
  };

  const handleDateClick = (date) => {
    const normalizedDate = startOfDay(date);
    const dateString = format(normalizedDate, 'yyyy-MM-dd');

    if (selectedDate === dateString) {
      setIsCalendarOpen(true);
    } else {
      setSelectedDate(dateString);
      setIsCalendarOpen(false);
    }
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDaysOfWeek = () => {
    return ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Культурные мероприятия Минска
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Откройте для себя богатую культурную жизнь столицы
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="Поиск по названию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="w-full md:w-64 relative">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`w-full h-10 px-3 py-2 rounded-lg border ${isCalendarOpen ? 'border-primary' : 'border-gray-300'} 
                          text-gray-700 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors`}
            >
              <span className="text-sm truncate">
                {selectedDate ? formatDotDate(selectedDate) : 'дд.мм.гг'}
              </span>
              <Calendar size={16} />
            </button>
            {isCalendarOpen && (
              <div className="absolute top-full right-0 w-64 p-4 bg-white border rounded-lg shadow-xl z-50 mt-1">
                <div className="mb-3 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500/30 border border-blue-300/50"></div>
                    <span>Сегодня</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500/30"></div>
                    <span>Выбранная дата</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border bg-red-200"></div>
                    <span>Доступная дата</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-200 opacity-50"></div>
                    <span>Недоступно</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={goToPrevMonth}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ←
                  </button>
                  <h3 className="font-medium text-gray-800">
                    {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                  </h3>
                  <button
                    onClick={goToNextMonth}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    →
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {getDaysOfWeek().map(day => (
                    <div key={day} className="text-center text-xs text-gray-500 font-medium">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 mb-3">
                  {daysInMonth.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isToday = isSameDay(date, new Date());
                    const isSelected = selectedDate === dateStr;
                    const isAvailable = isDateAvailable(date) && isFutureOrToday(date);

                    let buttonClass = "w-8 h-8 text-sm rounded-full transition-colors flex items-center justify-center ";

                    if (isSelected) {
                      buttonClass += "bg-green-500/30 text-green-700 font-bold";
                    } else if (isToday) {
                      buttonClass += "bg-blue-500/30 text-blue-700 border border-blue-300/50";
                    } else if (isAvailable) {
                      buttonClass += "hover:bg-primary/10 text-primary cursor-pointer";
                    } else {
                      buttonClass += "text-gray-300 cursor-not-allowed opacity-50";
                    }

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => handleDateClick(date)}
                        disabled={!isAvailable}
                        className={buttonClass}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedDate("");
                    setIsCalendarOpen(false);
                  }}
                  className="w-full text-primary border-primary/30 hover:bg-primary/5"
                >
                  Сбросить фильтр
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedEvents.map((event, index) => (
            <Card 
              key={event.id} 
              className="event-card animate-fade-in opacity-0
                         transition-all duration-300 
                         hover:scale-110 hover:-translate-y-4 hover:shadow-2xl hover:shadow-primary/40 
                         cursor-pointer"
              style={{ 
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'forwards' 
              }}
            >
              <img
                src={event.image || "/placeholder.svg"}
                alt={event.title}
                className="w-full aspect-video object-cover rounded-t-xl"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              <CardHeader>
                <div className="flex justify-between items-center mb-2 gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {capitalizeFirstLetter(event.category)}
                  </Badge>
                  {event.cost && (
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {event.cost}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg font-semibold line-clamp-2">
                  {event.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {event.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar size={16} className="mr-2" />
                  {formatDotDate(event.date)}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock size={16} className="mr-2" />
                  {event.time}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin size={16} className="mr-2" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
                <Link to={`/event/${event.id}`} className="block w-full">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedEvents.length === 0 && (
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ничего не найдено</h3>
            <p className="text-muted-foreground">Измените запрос или дату</p>
          </div>
        )}

        {sortedEvents.length > 0 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }}
                    aria-disabled={currentPage === 1}
                  >
                    Назад
                  </PaginationPrevious>
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}
                    aria-disabled={currentPage === totalPages}
                  >
                    Далее
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Events;