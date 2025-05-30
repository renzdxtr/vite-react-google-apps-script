
import { z } from "zod"

import { columns } from "./components/columns"
import { DataTable } from "./components/data-table"
import { UserNav } from "./components/user-nav"
import { useEffect, useState } from "react"
import * as serveFns from "@/server/gas"


export function TaskPage() {

  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    serveFns.getSheetData('Tasks').then((data) => {
      setTasks(JSON.parse(data))
    }
    ).catch((error) => {
      console.log(error)
    })
  }, [])

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your tasks for this month!
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <UserNav />
          </div>
        </div>
        <DataTable data={tasks} columns={columns} />
      </div>
    </>
  )
}
