import pygame, sys
from pathfinding.core.grid import Grid
from pathfinding.finder.a_star import AStarFinder

# pygame setup 
pygame.init()
screen = pygame.display.set_mode((1000, 1000))
clock = pygame.time.Clock()
font = pygame.font.SysFont(None, 48)

#  gamestate 
STATE_INPUT = "input"
STATE_PATH = "path"
state = STATE_INPUT

#  barcode & products 
barcode = ""
product1 = False
product2 = False
product3 = False

#  images 
bg_surf = pygame.image.load(
    '/Users/luukteunissen/Documents/School/Freshchoice/afb.jpg'
).convert()

select_surf = pygame.image.load(
    '/Users/luukteunissen/Documents/School/Freshchoice/Select.jpg'
).convert_alpha()

#  supermarket grid 
matrix = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,0,1,1,0,1,1,1],
    [1,1,1,0,1,1,0,1,1,1],
    [1,1,1,0,1,1,0,1,1,1],
    [1,1,1,0,1,1,0,1,1,1],
    [1,1,1,0,1,1,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1]
]

#  barcode processing 
def process_barcode(code):
    return (
        int(code[0:2]) != 0,
        int(code[2:4]) != 0,
        int(code[4:6]) != 0
    )

#  pathfinding 
class Pathfinder:
    def __init__(self, matrix):
        self.grid = Grid(matrix=matrix)
        self.path = []

    def create_path(self, p1, p2, p3):
        self.grid.cleanup()

        start = self.grid.node(0, 0)
        p1_node = self.grid.node(2, 5)
        p2_node = self.grid.node(4, 3)
        p3_node = self.grid.node(7, 5)
        end = self.grid.node(9, 0)

        finder = AStarFinder()

        begin1, _ = finder.find_path(start, p1_node, self.grid)
        begin2, _ = finder.find_path(start, p2_node, self.grid)
        begin3, _ = finder.find_path(start, p3_node, self.grid)

        step12, _ = finder.find_path(p1_node, p2_node, self.grid)
        step13, _ = finder.find_path(p1_node, p3_node, self.grid)
        step23, _ = finder.find_path(p2_node, p3_node, self.grid)

        end1, _ = finder.find_path(p1_node, end, self.grid)
        end2, _ = finder.find_path(p2_node, end, self.grid)
        end3, _ = finder.find_path(p3_node, end, self.grid)

        path = []

        if p1:
            path += begin1
        if p2:
            path += step12 if p1 else begin2
        if p3:
            if p2:
                path += step23
            elif p1:
                path += step13
            else:
                path += begin3

        if p3:
            path += end3
        elif p2:
            path += end2
        elif p1:
            path += end1

        self.path = path

    def draw_active_cell(self):
        mouse_pos = pygame.mouse.get_pos()
        row = mouse_pos[1] // 100
        col = mouse_pos[0] // 100

        if 0 <= row < 10 and 0 <= col < 10:
            rect = pygame.Rect(col*100, row*100, 100, 100)
            screen.blit(select_surf, rect)

    def draw_path(self):
        if self.path:
            points = [(n.x*100+50, n.y*100+50) for n in self.path]
            pygame.draw.lines(screen, (74, 74, 74), False, points, 5)

    def update(self):
        self.draw_active_cell()
        self.draw_path()

#  init 
pathfinder = Pathfinder(matrix)

#  main loop 
while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        if state == STATE_INPUT and event.type == pygame.KEYDOWN:
            if pygame.K_0 <= event.key <= pygame.K_9:
                barcode += event.unicode
                if len(barcode) == 6:
                    product1, product2, product3 = process_barcode(barcode)
                    state = STATE_PATH

    #  draw 
    screen.fill((30, 30, 30))

    if state == STATE_INPUT:
        screen.blit(
            font.render("Please scan the barcode", True, (255, 255, 255)),
            (300, 400)
        )
        screen.blit(
            font.render(barcode, True, (0, 255, 0)),
            (300, 460)
        )

    elif state == STATE_PATH:
        screen.blit(bg_surf, (0, 0))
        pathfinder.create_path(product1, product2, product3)
        pathfinder.update()

    pygame.display.update()
    clock.tick(60)
