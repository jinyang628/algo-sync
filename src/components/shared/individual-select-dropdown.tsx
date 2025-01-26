import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

type DropdownWithItemsProps = {
  name: string;
  items: string[];
  selectedItem: string;
  onSelectItem: (item: string) => void;
};

export default function IndividualSelectDropdown({
  name,
  items,
  selectedItem,
  onSelectItem,
}: DropdownWithItemsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-md bg-primary px-2 py-1 text-primary-foreground">
        {selectedItem || name}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="h-[250px]" side="bottom" align="center">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-1">
            {items.map((item, index) => (
              <DropdownMenuItem key={index} onClick={() => onSelectItem(item)}>
                {item}
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
