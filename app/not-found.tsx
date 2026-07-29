import {PageContainer} from "@/components/layout/PageContainer";
import {ButtonLink} from "@/components/ui/Button";

export default function NotFound() {
  return <PageContainer className="py-20 text-center"><p className="text-sm font-black text-red-700">ОШИБКА 404</p><h1
    className="mt-2 text-3xl font-black">Страница не найдена</h1><p className="mt-3 text-slate-600">Адрес изменился
    или такой страницы не существует.</p><ButtonLink href="/catalog" className="mt-6">Открыть
    каталог</ButtonLink></PageContainer>
}
