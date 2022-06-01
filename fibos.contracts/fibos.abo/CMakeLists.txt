add_executable(fibos.abo.wasm ${CMAKE_CURRENT_SOURCE_DIR}/src/fibos.abo.cpp)
target_include_directories(fibos.abo.wasm
   PUBLIC 
   ${CMAKE_CURRENT_SOURCE_DIR}/include)

set_target_properties(fibos.abo.wasm
   PROPERTIES
   RUNTIME_OUTPUT_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}/bin/fibos.abo")

configure_file("${CMAKE_CURRENT_SOURCE_DIR}/abi/fibos.abo.abi" "${CMAKE_CURRENT_SOURCE_DIR}/bin/fibos.abo" COPYONLY)

